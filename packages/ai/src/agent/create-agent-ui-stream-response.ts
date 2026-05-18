import type {
  Arrayable,
  Context,
  Experimental_Sandbox as Sandbox,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { GenerateTextOnStepFinishCallback } from '../generate-text/generate-text-events';
import type { Output } from '../generate-text/output';
import type { StreamTextTransform } from '../generate-text/stream-text';
import type { UIMessageStreamOptions } from '../generate-text/stream-text-result';
import type { TimeoutConfiguration } from '../prompt/request-options';
import { createUIMessageStreamResponse } from '../ui-message-stream';
import type { UIMessageStreamResponseInit } from '../ui-message-stream/ui-message-stream-response-init';
import type { InferUITools, UIMessage } from '../ui/ui-messages';
import type { Agent } from './agent';
import { createAgentUIStream } from './create-agent-ui-stream';

/**
 * 运行代理并返回带有UI消息流的响应对象。
 *
 * @param agent - 要运行的代理。
 * @param uiMessages - 输入 UI 消息。
 * @param abortSignal - 中止信号。选修的。
 * @param timeout - 超时（以毫秒为单位）。选修的。
 * @param experimental_sandbox - 传递到工具执行的沙箱环境。选修的。
 * @param options - 代理的选项。选修的。
 * @param experimental_transform - 流转换。选修的。
 * @param onStepFinish - 每个步骤完成时调用的回调。选修的。
 * @param headers - 响应的附加标头。选修的。
 * @param status - 响应的状态代码。选修的。
 * @param statusText - 响应的状态文本。选修的。
 * @param consumeSseStream - 是否消费SSE流。选修的。
 *
 * @returns 响应对象。
 */
export async function createAgentUIStreamResponse<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = never,
  MESSAGE_METADATA = unknown,
>({
  headers,
  status,
  statusText,
  consumeSseStream,
  ...options
}: {
  agent: Agent<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT, OUTPUT>;
  uiMessages: unknown[];
  abortSignal?: AbortSignal;
  timeout?: TimeoutConfiguration<TOOLS>;
  experimental_sandbox?: Sandbox;
  options?: CALL_OPTIONS;
  experimental_transform?: Arrayable<StreamTextTransform<TOOLS>>;
  onStepFinish?: GenerateTextOnStepFinishCallback<TOOLS>;
} & UIMessageStreamResponseInit &
  UIMessageStreamOptions<
    UIMessage<MESSAGE_METADATA, never, InferUITools<TOOLS>>
  >): Promise<Response> {
  return createUIMessageStreamResponse({
    headers,
    status,
    statusText,
    consumeSseStream,
    stream: await createAgentUIStream(options),
  });
}
