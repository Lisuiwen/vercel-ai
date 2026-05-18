import type { FetchFunction } from '@ai-sdk/provider-utils';

export type CompletionRequestOptions = {
  /**
   * 要传递到 API 端点的可选标头对象。
   */
  headers?: Record<string, string> | Headers;

  /**
   * 要传递到 API 端点的可选对象。
   */
  body?: object;
};

export type UseCompletionOptions = {
  /**
   * 接受“{提示：字符串}”对象并返回的API端点
   * AI 完成响应的令牌流。默认为“/api/completion”。
   */
  api?: string;
  /**
   * 完成的唯一标识符。如果没有提供，将随机提供一个
   * 生成的。提供后，具有相同“id”的“useCompletion”钩子将
   * 跨组件共享状态。
   */
  id?: string;

  /**
   * 初始提示输入完成。
   */
  initialInput?: string;

  /**
   * 初步完成结果。用于加载现有历史记录。
   */
  initialCompletion?: string;

  /**
   * 当流式传输完成时要调用的回调函数。
   */
  onFinish?: (prompt: string, completion: string) => void;

  /**
   * 遇到错误时调用的回调函数。
   */
  onError?: (error: Error) => void;

  /**
   * 用于获取请求的凭据模式。
   * 可能的值为：“省略”、“同源”、“包含”。
   * 默认为“同源”。
   */
  credentials?: RequestCredentials;

  /**
   * 与 API 请求一起发送的 HTTP 标头。
   */
  headers?: Record<string, string> | Headers;

  /**
   * 与 API 请求一起发送的额外主体对象。
   * @example
   * 将“sessionId”与提示一起发送到 API。
   * ````js
   * 使用完成（{
   *   正文：{
   *     会话 ID: '123',
   *   }
   * })
   * ```
   */
  body?: object;

  /**
   * 使用的流协议。默认为“数据”。
   */
  streamProtocol?: 'data' | 'text';

  /**
   * 自定义获取实现。您可以将其用作拦截请求的中间件，
   * 或者提供自定义的获取实现，例如测试。
   */
  fetch?: FetchFunction;
};
