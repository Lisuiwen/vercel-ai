import type { SharedV3Headers, SharedV3ProviderOptions } from '../../shared';

export type EmbeddingModelV3CallOptions = {
  /**
   * 要为其生成嵌入的文本值列表。
   */
  values: Array<string>;

  /**
   * 用于取消操作的中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV3ProviderOptions;

  /**
   * 与请求一起发送的附加 HTTP 标头。
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: SharedV3Headers;
};
