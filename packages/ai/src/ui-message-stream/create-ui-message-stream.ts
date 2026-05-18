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
 * 创建可用于向客户端发送消息的UI消息流。
 *
 * @param options.execute - 一个由编写器调用的函数，用于将 UI 消息块写入流。
 * @param options.onError - 从错误中提取错误消息的函数。默认为`getErrorMessage`。
 * @param options.originalMessages - 原始消息。如果提供，则假定为持久模式
 * 并为响应消息提供消息ID。
 * @param options.onStepFinish - 每个步骤完成时调用的回调。对于持久化中间消息很有用。
 * @param options.onFinish - 流结束时调用的回调。
 * @param options.generateId - 生成唯一 ID 的函数。默认为内置 ID 生成器。
 *
 * @returns UI 消息块的`ReadableStream`。
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

  // 等待所有正在进行的流完成。这种方法可以实现合并
  // 即使在执行返回后，只要仍然有一个流
  // 打开合并流。这用于例如转发新流和
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
