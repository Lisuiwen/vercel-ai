/**
 * 用于创建 UI 消息流响应的选项。
 * 使用附加流选项扩展标准“ResponseInit”。
 */
export type UIMessageStreamResponseInit = ResponseInit & {
  /**
   * 用于独立使用 SSE 流副本的可选回调。
   * 这对于并行记录、调试或处理流非常有用。
   * 回调接收流的 tee 副本，并且不会阻止响应。
   */
  consumeSseStream?: (options: {
    stream: ReadableStream<string>;
  }) => PromiseLike<void> | void;
};
