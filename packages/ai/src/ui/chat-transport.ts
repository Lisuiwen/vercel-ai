import type { UIMessageChunk } from '../ui-message-stream';
import type { ChatRequestOptions } from './chat';
import type { UIMessage } from './ui-messages';

/**
 * 用于处理聊天消息通信和流传输的传输接口。
 *
 * `ChatTransport`接口提供了对消息传输方式的细粒度控制
 * 发送到 API 端点以及如何处理响应。这使得
 * 替代通信协议，例如WebSockets、自定义身份验证
 * 模式或专门的后端集成。
 *
 * @template UI_MESSAGE - 扩展 UIMessage 的 UI 消息类型
 */
export interface ChatTransport<UI_MESSAGE extends UIMessage> {
  /**
   * 将消息发送到聊天API端点并返回流响应。
   *
   * 此方法处理新消息提交和消息重新生成。
   * 它支持通过 UIMessageChunk 事件进行实时响应流。
   *
   * @param options - 配置对象包含：
   * @param options.trigger - 消息提交类型：
   * - `'submit-message'`：提交新的用户消息
   * - `'regenerate-message'`：重新生成助手响应
   * @param options.chatId - 聊天会话的唯一标识符
   * @param options.messageId - 要重新生成的消息的 ID（对于重新生成消息触发器）或未定义的新消息
   * @param options.messages - 代表对话历史记录的 UI 消息数组
   * @param options.abortSignal - 如果需要，发出中止请求的信号
   * @param options.headers - 要包含在请求中的其他 HTTP 标头
   * @param options.body - 要包含在请求正文中的其他 JSON 属性
   * @param options.metadata - 要附加到请求的自定义元数据
   *
   * @returns Promise 解析为 UIMessageChunk 对象的 ReadableStream。
   *   该流发出各种块类型，例如：
   * - `text-start`、`text-delta`、`text-end`：用于流式传输文本内容
   * - `tool-input-start`、`tool-input-delta`、`tool-input-available`：用于工具调用
   * - `data-part-start`, `data-part-delta`, `data-part-available`: 对于数据部分
   * - `error`：用于错误处理
   *
   * @throws API请求失败或响应无效时出错
   */
  sendMessages: (
    options: {
      /* * 消息提交的类型 - 要么是新消息，要么是重新生成 */
      trigger: 'submit-message' | 'regenerate-message';
      /* * 聊天会话的唯一标识符 */
      chatId: string;
      /* * 要重新生成的消息的ID，或者对于新消息未定义 */
      messageId: string | undefined;
      /* * 代表对话历史记录的UI消息储备 */
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
   * @param options - 配置对象包含：
   * @param options.chatId - 要重新连接的聊天会话的唯一标识符
   * @param options.headers - 要包含在重新连接请求中的其他 HTTP 标头
   * @param options.body - 要包含在请求正文中的其他 JSON 属性
   * @param options.metadata - 要附加到请求的自定义元数据
   *
   * @returns 承诺解决：
   * - `ReadableStream<UIMessageChunk>`：如果找到活动流并且可以恢复
   * - `null`：如果指定的聊天会话不存在活动流（例如，响应已完成）
   *
   * @throws 重连请求失败或响应无效时出错
   */
  reconnectToStream: (
    options: {
      /* * 要重新连接的聊天会话的唯一标识符 */
      chatId: string;
    } & ChatRequestOptions,
  ) => Promise<ReadableStream<UIMessageChunk> | null>;
}
