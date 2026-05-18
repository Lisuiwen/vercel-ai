import type { ResponseMessage } from '../generate-text/response-message';

/**
 * 语言模型响应的元数据。
 */
export type LanguageModelResponseMetadata = {
  /**
   * 呼叫期间生成的响应消息。
   * 响应消息可以是辅助消息，也可以是工具消息。
   * 它们包含一个生成的 id。
   */
  readonly messages: Array<ResponseMessage>;

  /**
   * 生成的响应的 ID。
   */
  readonly id: string;

  /**
   * 生成的响应的开始时间戳。
   */
  readonly timestamp: Date;

  /**
   * 用于生成响应的响应模型的 ID。
   */
  readonly modelId: string;

  /**
   * 响应标头（仅适用于使用 HTTP 请求的提供者）。
   */
  readonly headers?: Record<string, string>;

  /**
   * 响应正文（仅适用于使用 HTTP 请求的提供商）。
   */
  readonly body?: unknown;
};
