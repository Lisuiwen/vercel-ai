import type { UIMessage } from '../ui/ui-messages';
import type { UIMessageChunk } from './ui-message-chunks';
import {
  createStreamingUIMessageState,
  processUIMessageStream,
  type StreamingUIMessageState,
} from '../ui/process-ui-message-stream';
import {
  createAsyncIterableStream,
  type AsyncIterableStream,
} from '../util/async-iterable-stream';
import { consumeStream } from '../util/consume-stream';

/**
 * 将`UIMessageChunk`流转换为`UIMessage`的`AsyncIterableStream`。
 *
 * @param options.message - 恢复对话时用作起点的最后一条助理消息。否则未定义。
 * @param options.stream - 要读取的`UIMessageChunk`流。
 * @param options.terminateOnError - 发生错误时是否终止流。
 * @param options.onError - 发生错误时调用的函数。
 *
 * @returns `UIMessage`的`AsyncIterableStream`。每个流部分是同一消息的不同状态
 * 因为它正在完成。
 */
export function readUIMessageStream<UI_MESSAGE extends UIMessage>({
  message,
  stream,
  onError,
  terminateOnError = false,
}: {
  message?: UI_MESSAGE;
  stream: ReadableStream<UIMessageChunk>;
  onError?: (error: unknown) => void;
  terminateOnError?: boolean;
}): AsyncIterableStream<UI_MESSAGE> {
  let controller: ReadableStreamDefaultController<UI_MESSAGE> | undefined;
  let hasErrored = false;

  const outputStream = new ReadableStream<UI_MESSAGE>({
    start(controllerParam) {
      controller = controllerParam;
    },
  });

  const state = createStreamingUIMessageState<UI_MESSAGE>({
    messageId: message?.id ?? '',
    lastMessage: message,
  });

  const handleError = (error: unknown) => {
    onError?.(error);

    if (!hasErrored && terminateOnError) {
      hasErrored = true;
      controller?.error(error);
    }
  };

  consumeStream({
    stream: processUIMessageStream({
      stream,
      runUpdateMessageJob(
        job: (options: {
          state: StreamingUIMessageState<UI_MESSAGE>;
          write: () => void;
        }) => Promise<void>,
      ) {
        return job({
          state,
          write: () => {
            controller?.enqueue(structuredClone(state.message));
          },
        });
      },
      onError: handleError,
    }),
    onError: handleError,
  }).finally(() => {
    // 仅在未发生错误时关闭。在出现错误的控制器上调用 close()
    // 抛出“无效状态：控制器已关闭”类型错误。
    if (!hasErrored) {
      controller?.close();
    }
  });

  return createAsyncIterableStream(outputStream);
}
