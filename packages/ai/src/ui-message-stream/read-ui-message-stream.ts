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
 * 将“UIMessageChunk”流转换为“UIMessage”的“AsyncIterableStream”。
 *
 * @param options.message - The last assistant message to use as a starting point when the conversation is resumed. Otherwise undefined.
 * @param options.stream - The stream of `UIMessageChunk`s to read.
 * @param options.terminateOnError - Whether to terminate the stream if an error occurs.
 * @param options.onError - A function that is called when an error occurs.
 *
 * @returns An `AsyncIterableStream` of `UIMessage`s. Each stream part is a different state of the same message
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
    // 仅在未发生错误时关闭。在出错的控制器上调用 close()
    // 抛出“无效状态：控制器已关闭”类型错误。
    if (!hasErrored) {
      controller?.close();
    }
  });

  return createAsyncIterableStream(outputStream);
}
