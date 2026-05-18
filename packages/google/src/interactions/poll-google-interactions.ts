import {
  createJsonResponseHandler,
  delay,
  getFromApi,
  isAbortError,
  type FetchFunction,
} from '@ai-sdk/provider-utils';
import { googleFailedResponseHandler } from '../google-error';
import { cancelGoogleInteraction } from './cancel-google-interaction';
import {
  googleInteractionsResponseSchema,
  type GoogleInteractionsResponse,
} from './google-interactions-api';
import type { GoogleInteractionsStatus } from './google-interactions-prompt';

const TERMINAL_STATUSES: ReadonlySet<GoogleInteractionsStatus | string> =
  new Set(['completed', 'failed', 'cancelled', 'incomplete']);

export function isTerminalStatus(
  status: GoogleInteractionsStatus | string | null | undefined,
): boolean {
  return status != null && TERMINAL_STATUSES.has(status);
}

/*
 * 后台交互的默认轮询节奏。从 1 秒开始，双倍
 * 每个滴答声达到 10 秒的上限，并在 30 分钟后放弃——代理运行
 * 例如深度研究可能需要服务器端数十分钟的时间，所以我们犯了错误
 * 长边而不是截断实际运行。通过覆盖每次调用
 * `providerOptions.google.pollingTimeoutMs`。
 */
const DEFAULT_INITIAL_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 10000;
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export type PollGoogleInteractionResult = {
  response: GoogleInteractionsResponse;
  rawResponse: unknown;
  responseHeaders: Record<string, string> | undefined;
};

/**
 * 轮询“GET {baseURL}/interactions/{id}”，直到响应状态为
 * 终端（“已完成”/“失败”/“已取消”/“不完整”）。抛出如果
 * 轮询循环超过“timeoutMs”，响应没有“id”可供轮询，
 * 或中止信号触发。
 */
export async function pollGoogleInteractionUntilTerminal({
  baseURL,
  interactionId,
  headers,
  fetch,
  abortSignal,
  initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  baseURL: string;
  interactionId: string | null | undefined;
  headers: Record<string, string | undefined>;
  fetch?: FetchFunction;
  abortSignal?: AbortSignal;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}): Promise<PollGoogleInteractionResult> {
  if (interactionId == null || interactionId.length === 0) {
    throw new Error(
      'google.interactions: cannot poll a background interaction without an id. ' +
        'The POST response did not include an interaction id.',
    );
  }

  const startedAt = Date.now();
  let nextDelayMs = initialDelayMs;
  const url = `${baseURL}/interactions/${encodeURIComponent(interactionId)}`;

  /*
   * 当调用者中止时，尽最大努力触发 `POST /interactions/{id}/cancel`
   * 因此 Google 方面将停止计费。包裹每条出口路径
   * 由中止触发——显式的“abortSignal.aborted”检查，
   * `delay()` 抛出的 AbortError 以及 `getFromApi` 抛出的任何 AbortError。
   */
  const cancelOnServer = () =>
    cancelGoogleInteraction({ baseURL, interactionId, headers, fetch });

  try {
    while (true) {
      if (abortSignal?.aborted) {
        await cancelOnServer();
        throw new DOMException('Polling was aborted', 'AbortError');
      }

      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(
          `google.interactions: timed out polling interaction ${interactionId} after ${timeoutMs}ms.`,
        );
      }

      await delay(nextDelayMs, { abortSignal });

      const {
        value: response,
        rawValue: rawResponse,
        responseHeaders,
      } = await getFromApi({
        url,
        headers,
        failedResponseHandler: googleFailedResponseHandler,
        successfulResponseHandler: createJsonResponseHandler(
          googleInteractionsResponseSchema,
        ),
        abortSignal,
        fetch,
      });

      if (isTerminalStatus(response.status)) {
        return { response, rawResponse, responseHeaders };
      }

      nextDelayMs = Math.min(nextDelayMs * 2, maxDelayMs);
    }
  } catch (error) {
    if (isAbortError(error)) {
      await cancelOnServer();
    }
    throw error;
  }
}
