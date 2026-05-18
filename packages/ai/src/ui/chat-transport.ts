import type { UIMessageChunk } from '../ui-message-stream';
import type { ChatRequestOptions } from './chat';
import type { UIMessage } from './ui-messages';

/**
 * 用于处理聊天消息通信和流传输的传输接口。
 *
 * “ChatTransport”接口提供了对消息传输方式的细粒度控制
 * 发送到 API 端点以及如何处理响应。这使得
 * 替代通信协议，例如 WebSockets、自定义身份验证
 * 模式或专门的后端集成。
 *
 * @template UI_MESSAGE - The UI message type extending UIMessage
 */
export interface ChatTransport<UI_MESSAGE extends UIMessage> {
  /**
   * 将消息发送到聊天 API 端点并返回流响应。
   *
   * 此方法处理新消息提交和消息重新生成。
   * 它支持通过 UIMessageChunk 事件进行实时响应流。
   *
   * @param options - Configuration object containing:
   * @param options.trigger - The type of message submission:
   *   - `'submit-message'`：提交新的用户消息
   *   - `'regenerate-message'`：重新生成助理响应
   * @param options.chatId - Unique identifier for the chat session
   * @param options.messageId - ID of the message to regenerate (for regenerate-message trigger) or undefined for new messages
   * @param options.messages - Array of UI messages representing the conversation history
   * @param options.abortSignal - Signal to abort the request if needed
   * @param options.headers - Additional HTTP headers to include in the request
   * @param options.body - Additional JSON properties to include in the request body
   * @param options.metadata - Custom metadata to attach to the request
   *
   * @returns Promise resolving to a ReadableStream of UIMessageChunk objects.
   *   该流发出各种块类型，例如：
   *   - `text-start`、`text-delta`、`text-end`：用于流式传输文本内容
   *   - `tool-input-start`、`tool-input-delta`、`tool-input-available`：用于工具调用
   *   - `data-part-start`, `data-part-delta`, `data-part-available`: 对于数据部分
   *   - `error`：用于错误处理
   *
   * @throws Error when the API request fails or response is invalid
   */
  sendMessages: (
    options: {
      /* * 消息提交的类型 - 要么是新消息，要么是重新生成 */
      trigger: 'submit-message' | 'regenerate-message';
      /* * 聊天会话的唯一标识符 */
      chatId: string;
      /* * 要重新生成的消息的 ID，或者对于新消息未定义 */
      messageId: string | undefined;
      /* * 代表对话历史记录的 UI 消息数组 */
      messages: UI_MESSAGE[];
      /* * 如果需要，发出中止请求的信号 */
      abortSignal: AbortSignal | undefined;
    } & ChatRequestOptions,
  ) => Promise<ReadableStream<UIMessageChunk>>;

  /**
   * 重新连接到指定聊天会话的现有流响应。
   *
   * 该方法用于在连接中断时恢复流式传输
   * 或者恢复聊天会话时。它对于维护特别有用
   * 长时间运行的对话的连续性或从网络问题中恢复。
   *
   * @param options - Configuration object containing:
   * @param options.chatId - Unique identifier for the chat session to reconnect to
   * @param options.headers - Additional HTTP headers to include in the reconnection request
   * @param options.body - Additional JSON properties to include in the request body
   * @param options.metadata - Custom metadata to attach to the request
   *
   * @returns Promise resolving to:
   *   - `ReadableStream<UIMessageChunk>`：如果找到活动流并且可以恢复
   *   - `null`：如果指定的聊天会话不存在活动流（例如，响应已完成）
   *
   * @throws Error when the reconnection request fails or response is invalid
   */
  reconnectToStream: (
    options: {
      /* * 要重新连接的聊天会话的唯一标识符 */
      chatId: string;
    } & ChatRequestOptions,
  ) => Promise<ReadableStream<UIMessageChunk> | null>;
}
