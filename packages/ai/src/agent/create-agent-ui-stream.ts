import type {
  Arrayable,
  Context,
  Experimental_Sandbox as Sandbox,
  Tool,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { GenerateTextOnStepFinishCallback } from '../generate-text/generate-text-events';
import type { Output } from '../generate-text/output';
import type { StreamTextTransform } from '../generate-text/stream-text';
import type { UIMessageStreamOptions } from '../generate-text/stream-text-result';
import type { TimeoutConfiguration } from '../prompt/request-options';
import type { InferUIMessageChunk } from '../ui-message-stream';
import { convertToModelMessages } from '../ui/convert-to-model-messages';
import type {
  InferUIMessageTools,
  InferUITools,
  UIMessage,
} from '../ui/ui-messages';
import { validateUIMessages } from '../ui/validate-ui-messages';
import type { AsyncIterableStream } from '../util/async-iterable-stream';
import type { Agent } from './agent';

/**
 * 运行代理把输出作为UI消息流进行流式传输。
 *
 * @param agent - 要运行的代理。
 * @param uiMessages - 输入 UI 消息。
 * @param abortSignal - 中止信号。选修的。
 * @param timeout - 超时（以毫秒为单位）。选修的。
 * @param experimental_sandbox - 传递到工具执行的沙箱环境。选修的。
 * @param options - 代理的选项。
 * @param experimental_transform - 流变换。选修的。
 * @param onStepFinish - 每个步骤完成时调用的回调。选修的。
 *
 * @returns UI 消息流。
 */
export async function createAgentUIStream<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = never,
  MESSAGE_METADATA = unknown,
>({
  agent,
  uiMessages,
  options,
  abortSignal,
  timeout,
  experimental_sandbox: sandbox,
  experimental_transform,
  onStepFinish,
  ...uiMessageStreamOptions
}: {
  agent: Agent<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT, OUTPUT>;
  uiMessages: unknown[];
  abortSignal?: AbortSignal;
  timeout?: TimeoutConfiguration<TOOLS>;
  experimental_sandbox?: Sandbox;
  options?: CALL_OPTIONS;
  experimental_transform?: Arrayable<StreamTextTransform<TOOLS>>;
  onStepFinish?: GenerateTextOnStepFinishCallback<TOOLS>;
  // TODO `originalMessages` 是 bc 的一部分，在 v7 中省略
} & UIMessageStreamOptions<
  UIMessage<MESSAGE_METADATA, never, InferUITools<TOOLS>>
>): Promise<
  AsyncIterableStream<
    InferUIMessageChunk<UIMessage<MESSAGE_METADATA, never, InferUITools<TOOLS>>>
  >
> {
  const validatedMessages = await validateUIMessages<
    UIMessage<MESSAGE_METADATA, never, InferUITools<TOOLS>>
  >({
    messages: uiMessages,
    // 工具兼容；需要进行转换，因为上下文参数是
    // 在用户界面消息中不可用
    tools: agent.tools as unknown as {
      [NAME in keyof InferUIMessageTools<
        UIMessage<MESSAGE_METADATA, never, InferUITools<TOOLS>>
      > &
        string]?: Tool<
        InferUIMessageTools<
          UIMessage<MESSAGE_METADATA, never, InferUITools<TOOLS>>
        >[NAME]['input'],
        InferUIMessageTools<
          UIMessage<MESSAGE_METADATA, never, InferUITools<TOOLS>>
        >[NAME]['output']
      >;
    },
  });

  const modelMessages = await convertToModelMessages(validatedMessages, {
    tools: agent.tools,
  });

  const result = await agent.stream({
    prompt: modelMessages,
    options: options as CALL_OPTIONS,
    abortSignal,
    timeout,
    experimental_sandbox: sandbox,
    experimental_transform,
    onStepFinish,
  });

  return result.toUIMessageStream({
    ...uiMessageStreamOptions,
    // TODO 阅读 `originalMessages` 是针对 bc，在 v7 中始终使用 `validatedMessages`
    originalMessages:
      uiMessageStreamOptions.originalMessages ?? validatedMessages,
  });
}
