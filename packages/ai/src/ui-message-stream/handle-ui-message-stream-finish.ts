import {
  createStreamingUIMessageState,
  processUIMessageStream,
  type StreamingUIMessageState,
} from '../ui/process-ui-message-stream';
import type { UIMessage } from '../ui/ui-messages';
import type { ErrorHandler } from '../util/error-handler';
import type { InferUIMessageChunk, UIMessageChunk } from './ui-message-chunks';
import type { UIMessageStreamOnFinishCallback } from './ui-message-stream-on-finish-callback';
import type { UIMessageStreamOnStepFinishCallback } from './ui-message-stream-on-step-finish-callback';

export function handleUIMessageStreamFinish<UI_MESSAGE extends UIMessage>({
  messageId,
  originalMessages = [],
  onStepFinish,
  onFinish,
  onError,
  stream,
}: {
  stream: ReadableStream<InferUIMessageChunk<UI_MESSAGE>>;

  /**
   * 用于响应消息的消息 ID。
   * 如果未提供，则不会为响应消息设置 id。
   */
  messageId?: string;

  /**
   * 原始消息。
   */
  originalMessages?: UI_MESSAGE[];

  onError: ErrorHandler;

  /**
   * 在多步骤代理运行期间每个步骤完成时调用的回调。
   */
  onStepFinish?: UIMessageStreamOnStepFinishCallback<UI_MESSAGE>;

  onFinish?: UIMessageStreamOnFinishCallback<UI_MESSAGE>;
}): ReadableStream<InferUIMessageChunk<UI_MESSAGE>> {
  // 最后一条消息仅与助理消息相关
  let lastMessage: UI_MESSAGE | undefined =
    originalMessages?.[originalMessages.length - 1];
  if (lastMessage?.role !== 'assistant') {
    lastMessage = undefined;
  } else {
    // 附加到最后一条消息，因此我们需要使用相同的 id
    messageId = lastMessage.id;
  }

  let isAborted = false;

  const idInjectedStream = stream.pipeThrough(
    new TransformStream<
      InferUIMessageChunk<UI_MESSAGE>,
      InferUIMessageChunk<UI_MESSAGE>
    >({
      transform(chunk, controller) {
        // 当start chunk中没有messageId时，
        // 但用户检查了持久性，
        // 将 messageId 注入到 chunk 中
        if (chunk.type === 'start') {
          const startChunk = chunk as UIMessageChunk & { type: 'start' };
          if (startChunk.messageId == null && messageId != null) {
            startChunk.messageId = messageId;
          }
        }

        if (chunk.type === 'abort') {
          isAborted = true;
        }

        controller.enqueue(chunk);
      },
    }),
  );

  // 仅当我们需要跟踪回调状态时才处理流
  if (onFinish == null && onStepFinish == null) {
    return idInjectedStream;
  }

  const state = createStreamingUIMessageState<UI_MESSAGE>({
    lastMessage: lastMessage
      ? (structuredClone(lastMessage) as UI_MESSAGE)
      : undefined,
    messageId: messageId ?? '', // 将被流覆盖
  });

  const runUpdateMessageJob = async (
    job: (options: {
      state: StreamingUIMessageState<UI_MESSAGE>;
      write: () => void;
    }) => Promise<void>,
  ) => {
    await job({ state, write: () => {} });
  };

  let finishCalled = false;

  const callOnFinish = async () => {
    if (finishCalled || !onFinish) {
      return;
    }
    finishCalled = true;

    const isContinuation = state.message.id === lastMessage?.id;
    await onFinish({
      isAborted,
      isContinuation,
      responseMessage: state.message as UI_MESSAGE,
      messages: [
        ...(isContinuation ? originalMessages.slice(0, -1) : originalMessages),
        state.message,
      ] as UI_MESSAGE[],
      finishReason: state.finishReason,
    });
  };

  const callOnStepFinish = async () => {
    if (!onStepFinish) {
      return;
    }

    const isContinuation = state.message.id === lastMessage?.id;

    try {
      await onStepFinish({
        isContinuation,
        responseMessage: structuredClone(state.message) as UI_MESSAGE,
        messages: [
          ...(isContinuation
            ? originalMessages.slice(0, -1)
            : originalMessages),
          structuredClone(state.message),
        ] as UI_MESSAGE[],
      });
    } catch (error) {
      onError(error);
    }
  };

  return processUIMessageStream<UI_MESSAGE>({
    stream: idInjectedStream,
    runUpdateMessageJob,
    onError,
  }).pipeThrough(
    new TransformStream<
      InferUIMessageChunk<UI_MESSAGE>,
      InferUIMessageChunk<UI_MESSAGE>
    >({
      async transform(chunk, controller) {
        if (chunk.type === 'finish-step') {
          await callOnStepFinish();
        }

        controller.enqueue(chunk);
      },
      // @ts-expect-error cancel 仍然是新的，类型 https://developer.mozilla.org/en-US/docs/Web/API/TransformStream#browser_compatibility
      async cancel() {
        await callOnFinish();
      },

      async flush() {
        await callOnFinish();
      },
    }),
  );
}
