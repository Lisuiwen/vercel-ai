import {
  generateId as generateIdFunc,
  getErrorMessage,
  type IdGenerator,
} from '@ai-sdk/provider-utils';
import type { UIMessage } from '../ui/ui-messages';
import { handleUIMessageStreamFinish } from './handle-ui-message-stream-finish';
import type { InferUIMessageChunk } from './ui-message-chunks';
import type { UIMessageStreamOnFinishCallback } from './ui-message-stream-on-finish-callback';
import type { UIMessageStreamOnStepFinishCallback } from './ui-message-stream-on-step-finish-callback';
import type { UIMessageStreamWriter } from './ui-message-stream-writer';

/**
 * 创建可用于向客户端发送消息的 UI 消息流。
 *
 * @param options.execute - A function that is called with a writer to write UI message chunks to the stream.
 * @param options.onError - A function that extracts an error message from an error. Defaults to `getErrorMessage`.
 * @param options.originalMessages - The original messages. If provided, persistence mode is assumed
 *   并为响应消息提供消息ID。
 * @param options.onStepFinish - A callback that is called when each step finishes. Useful for persisting intermediate messages.
 * @param options.onFinish - A callback that is called when the stream finishes.
 * @param options.generateId - A function that generates a unique ID. Defaults to the built-in ID generator.
 *
 * @returns A `ReadableStream` of UI message chunks.
 */
export function createUIMessageStream<UI_MESSAGE extends UIMessage>({
  execute,
  onError = getErrorMessage,
  originalMessages,
  onStepFinish,
  onFinish,
  generateId = generateIdFunc,
}: {
  execute: (options: {
    writer: UIMessageStreamWriter<UI_MESSAGE>;
  }) => Promise<void> | void;
  onError?: (error: unknown) => string;

  /**
   * 原始消息。如果提供了它们，则假定为持久模式，
   * 并为响应消息提供消息ID。
   */
  originalMessages?: UI_MESSAGE[];

  /**
   * 在多步骤代理运行期间每个步骤完成时调用的回调。
   */
  onStepFinish?: UIMessageStreamOnStepFinishCallback<UI_MESSAGE>;

  onFinish?: UIMessageStreamOnFinishCallback<UI_MESSAGE>;

  generateId?: IdGenerator;
}): ReadableStream<InferUIMessageChunk<UI_MESSAGE>> {
  let controller!: ReadableStreamDefaultController<
    InferUIMessageChunk<UI_MESSAGE>
  >;

  const ongoingStreamPromises: Promise<void>[] = [];

  const stream = new ReadableStream({
    start(controllerArg) {
      controller = controllerArg;
    },
  });

  function safeEnqueue(data: InferUIMessageChunk<UI_MESSAGE>) {
    try {
      controller.enqueue(data);
    } catch {
      // 当流关闭时抑制错误
    }
  }

  try {
    const result = execute({
      writer: {
        write(part: InferUIMessageChunk<UI_MESSAGE>) {
          safeEnqueue(part);
        },
        merge(streamArg) {
          ongoingStreamPromises.push(
            (async () => {
              const reader = streamArg.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                safeEnqueue(value);
              }
            })().catch(error => {
              safeEnqueue({
                type: 'error',
                errorText: onError(error),
              } as InferUIMessageChunk<UI_MESSAGE>);
            }),
          );
        },
        onError,
      },
    });

    if (result) {
      ongoingStreamPromises.push(
        result.catch(error => {
          safeEnqueue({
            type: 'error',
            errorText: onError(error),
          } as InferUIMessageChunk<UI_MESSAGE>);
        }),
      );
    }
  } catch (error) {
    safeEnqueue({
      type: 'error',
      errorText: onError(error),
    } as InferUIMessageChunk<UI_MESSAGE>);
  }

  // Wait until all ongoing streams are done. This approach enables merging
  // streams even after execute has returned, as long as there is still an
  // open merged stream.这对于例如forward new streams and
  // 来自回调。
  const waitForStreams: Promise<void> = new Promise(async resolve => {
    while (ongoingStreamPromises.length > 0) {
      await ongoingStreamPromises.shift();
    }
    resolve();
  });

  waitForStreams.finally(() => {
    try {
      controller.close();
    } catch {
      // 当流关闭时抑制错误
    }
  });

  return handleUIMessageStreamFinish<UI_MESSAGE>({
    stream,
    messageId: generateId(),
    originalMessages,
    onStepFinish,
    onFinish,
    onError,
  });
}
