import type { ModelMessage } from '@ai-sdk/provider-utils';

/**
 * 语言模型请求的元数据。
 */
export type LanguageModelRequestMetadata = {
  /**
   * 为此步骤发送到模型的输入消息。
   */
  readonly messages?: Array<ModelMessage>;

  /**
   * 请求发送到创建 API 的 HTTP 正文。
   */
  readonly body?: unknown;
};
