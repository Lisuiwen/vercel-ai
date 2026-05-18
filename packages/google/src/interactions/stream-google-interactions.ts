import {
  createEventSourceResponseHandler,
  delay,
  getFromApi,
  isAbortError,
  type FetchFunction,
  type ParseResult,
} from '@ai-sdk/provider-utils';
import { googleFailedResponseHandler } from '../google-error';
import { cancelGoogleInteraction } from './cancel-google-interaction';
import {
  googleInteractionsEventSchema,
  type GoogleInteractionsEvent,
} from './google-interactions-api';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;

/**
 * 连接到“GET {baseURL}/interactions/{id}?stream=true”并显示
 * 服务器以 `ReadableStream<ParseResult<GoogleInteractionsEvent>>` 形式发送事件
 * 因此现有的“buildGoogleInteractionsStreamTransform”可以使用它们
 * 不变。
 *
 * 连接可能会在运行中中断：深度研究代理长时间空闲
 * SSE 事件和 undici 的默认主体超时之间的延伸
 * 带有“UND_ERR_BODY_TIMEOUT”的请求。我们跟踪最后一次看到的“event_id”
 * 并在任何意外结束时重新连接“?last_event_id=<id>”。之后
 * `maxRetries` 连续失败流会出错，以便调用者可以
 * 决定是否退回轮询。
 *
 * 当“interaction.complete”事件与
 * 终端状态到达，或者“错误”事件到达时。
 */
export function streamGoogleInteractionEvents({
  baseURL,
  interactionId,
  headers,
  fetch,
  abortSignal,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
}: {
  baseURL: string;
  interactionId: string;
  headers: Record<string, string | undefined>;
  fetch?: FetchFunction;
  abortSignal?: AbortSignal;
  maxRetries?: number;
  retryDelayMs?: number;
}): ReadableStream<ParseResult<GoogleInteractionsEvent>> {
  if (interactionId.length === 0) {
    throw new Error(
      'google.interactions: cannot stream a background interaction without an id.',
    );
  }

  const eventSourceHeaders = {
    ...headers,
    accept: 'text/event-stream',
  };

  let lastEventId: string | undefined;
  let complete = false;
  let attempt = 0;
  let receivedAnyEventThisAttempt = false;
  let currentReader:
    | ReadableStreamDefaultReader<ParseResult<GoogleInteractionsEvent>>
    | undefined;

  /*
   * 将“cancel()”从消费者（和上游“abortSignal”）转发到
   * 任何正在进行的“getFromApi”或“delay”，以便循环立即解除阻塞
   * 而不是等待下一次迭代才能注意到标志。
   */
  const internalAbort = new AbortController();
  const upstreamAbortHandler = () => internalAbort.abort();
  if (abortSignal != null) {
    if (abortSignal.aborted) {
      internalAbort.abort();
    } else {
      abortSignal.addEventListener('abort', upstreamAbortHandler, {
        once: true,
      });
    }
  }
  const effectiveSignal = internalAbort.signal;

  function buildUrl(): string {
    const base = `${baseURL}/interactions/${encodeURIComponent(interactionId)}`;
    const params = new URLSearchParams({ stream: 'true' });
    if (lastEventId != null) {
      params.set('last_event_id', lastEventId);
    }
    return `${base}?${params.toString()}`;
  }

  async function openReader() {
    const { value: stream } = await getFromApi({
      url: buildUrl(),
      headers: eventSourceHeaders,
      failedResponseHandler: googleFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        googleInteractionsEventSchema,
      ),
      abortSignal: effectiveSignal,
      fetch,
    });
    return stream.getReader();
  }

  return new ReadableStream<ParseResult<GoogleInteractionsEvent>>({
    async start(controller) {
      try {
        while (!complete && !effectiveSignal.aborted) {
          if (currentReader == null) {
            try {
              currentReader = await openReader();
              receivedAnyEventThisAttempt = false;
            } catch (error) {
              if (isAbortError(error) || effectiveSignal.aborted) {
                controller.error(error);
                return;
              }
              attempt++;
              if (attempt >= maxRetries) {
                controller.error(error);
                return;
              }
              await delay(retryDelayMs * attempt, {
                abortSignal: effectiveSignal,
              });
              continue;
            }
          }

          try {
            const { done, value } = await currentReader.read();
            if (done) {
              /*
               * 底层流结束。如果我们已经看到了终端事件
               * 我们干净利落地退出；否则这是意外的断开连接
               * 我们将重新连接“last_event_id”。
               *
               * 如果连接关闭而根本没有产生任何事件
               * 这次尝试，将其视为失败的尝试 - 否则
               * 空/行为不当的服务器响应将永远循环。
               */
              currentReader = undefined;
              if (complete) break;
              if (!receivedAnyEventThisAttempt) {
                attempt++;
                if (attempt >= maxRetries) {
                  controller.error(
                    new Error(
                      'google.interactions: SSE stream closed without producing any events.',
                    ),
                  );
                  return;
                }
                await delay(retryDelayMs * attempt, {
                  abortSignal: effectiveSignal,
                });
              } else {
                attempt = 0;
              }
              continue;
            }

            receivedAnyEventThisAttempt = true;

            if (value.success) {
              const ev = value.value as {
                event_id?: string;
                event_type?: string;
              };
              if (typeof ev.event_id === 'string' && ev.event_id.length > 0) {
                lastEventId = ev.event_id;
              }
              if (
                ev.event_type === 'interaction.completed' ||
                ev.event_type === 'error'
              ) {
                complete = true;
              }
            }

            controller.enqueue(value);
          } catch (error) {
            if (isAbortError(error) || effectiveSignal.aborted) {
              controller.error(error);
              return;
            }
            currentReader = undefined;
            attempt++;
            if (attempt >= maxRetries) {
              controller.error(error);
              return;
            }
            await delay(retryDelayMs * attempt, {
              abortSignal: effectiveSignal,
            });
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        if (abortSignal != null) {
          abortSignal.removeEventListener('abort', upstreamAbortHandler);
        }
        currentReader?.cancel().catch(() => {});
        currentReader = undefined;

        /*
         * 如果我们因为调用者中止（或消费者）而退出
         * 取消流）在代理完成之前，触发
         * `POST /interactions/{id}/cancel` 因此运行停止计费
         * 谷歌这边。设置“complete”时跳过——代理已经
         * 通过“interaction.complete”/“error”报告终端状态。
         */
        if (effectiveSignal.aborted && !complete) {
          await cancelGoogleInteraction({
            baseURL,
            interactionId,
            headers,
            fetch,
          });
        }
      }
    },

    cancel() {
      internalAbort.abort();
      currentReader?.cancel().catch(() => {});
      currentReader = undefined;
    },
  });
}
