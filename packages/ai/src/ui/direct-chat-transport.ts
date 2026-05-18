import type { Agent } from '../agent/agent';
import type { Output } from '../generate-text/output';
import type { UIMessageStreamOptions } from '../generate-text/stream-text-result';
import type { Context, Tool, ToolSet } from '@ai-sdk/provider-utils';
import type { UIMessageChunk } from '../ui-message-stream/ui-message-chunks';
import type { ChatTransport } from './chat-transport';
import { convertToModelMessages } from './convert-to-model-messages';
import type {
  InferUIMessageTools,
  InferUITools,
  UIMessage,
} from './ui-messages';
import { validateUIMessages } from './validate-ui-messages';

/**
 * “DirectChatTransport”类的选项。
 */
export type DirectChatTransportOptions<
  CALL_OPTIONS,
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
  OUTPUT extends Output,
  UI_MESSAGE extends UIMessage<unknown, never, InferUITools<TOOLS>>,
> = {
  /**
   * 用于生成响应的代理。
   */
  agent: Agent<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT, OUTPUT>;

  /**
   * Options to pass to the agent when calling it.
   */
  options?: CALL_OPTIONS;
} & Omit<UIMessageStreamOptions<UI_MESSAGE>, 'onFinish'>;

/**
 * 直接与进程内代理通信的传输，
 * 无需通过 HTTP。这对于：
 * - 服务端渲染场景
 * - 无网络测试
 * - 单进程应用程序
 *
 * @example
 * ````tsx
 * 从'@ai-sdk/react'导入{useChat}；
 * 从 'ai' 导入 { DirectChatTransport }；
 * 从 './my-agent' 导入 { myAgent }；
 *
 * const { 消息, sendMessage } = useChat({
 *   传输：新的 DirectChatTransport({ 代理: myAgent }),
 * });
 * ```
 */
export class DirectChatTransport<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = never,
  UI_MESSAGE extends UIMessage<unknown, never, InferUITools<TOOLS>> = UIMessage<
    unknown,
    never,
    InferUITools<TOOLS>
  >,
> implements ChatTransport<UI_MESSAGE> {
  private readonly agent: Agent<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT, OUTPUT>;
  private readonly agentOptions: CALL_OPTIONS | undefined;
  private readonly uiMessageStreamOptions: Omit<
    UIMessageStreamOptions<UI_MESSAGE>,
    'onFinish'
  >;

  constructor({
    agent,
    options,
    ...uiMessageStreamOptions
  }: DirectChatTransportOptions<
    CALL_OPTIONS,
    TOOLS,
    RUNTIME_CONTEXT,
    OUTPUT,
    UI_MESSAGE
  >) {
    this.agent = agent;
    this.agentOptions = options;
    this.uiMessageStreamOptions = uiMessageStreamOptions;
  }

  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<UI_MESSAGE>['sendMessages']>[0]): Promise<
    ReadableStream<UIMessageChunk>
  > {
    // 验证传入的 UI 消息
    const validatedMessages = await validateUIMessages<UI_MESSAGE>({
      messages,
      // 工具兼容；需要进行转换，因为上下文参数是
      // 在用户界面消息中不可用
      tools: this.agent.tools as unknown as {
        [NAME in keyof InferUIMessageTools<UI_MESSAGE> & string]?: Tool<
          InferUIMessageTools<UI_MESSAGE>[NAME]['input'],
          InferUIMessageTools<UI_MESSAGE>[NAME]['output']
        >;
      },
    });

    // 将 UI 消息转换为模型消息
    const modelMessages = await convertToModelMessages(validatedMessages, {
      tools: this.agent.tools,
    });

    // 来自代理的流
    const result = await this.agent.stream({
      prompt: modelMessages,
      abortSignal,
      ...(this.agentOptions !== undefined
        ? { options: this.agentOptions }
        : {}),
    } as Parameters<
      Agent<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT, OUTPUT>['stream']
    >[0]);

    // 返回UI消息流
    return result.toUIMessageStream(this.uiMessageStreamOptions);
  }

  /**
   * 直接传输不支持重连，因为没有
   * 要重新连接的持久服务器端流。
   *
   * @returns Always returns `null`
   */
  async reconnectToStream(
    _options: Parameters<ChatTransport<UI_MESSAGE>['reconnectToStream']>[0],
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
