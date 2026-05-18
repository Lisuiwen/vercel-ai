import type { JSONObject } from '../../json-value';
import type { SharedV4Headers, SharedV4ProviderOptions } from '../../shared/v4';

export type RerankingModelV4CallOptions = {
  /**
   * 要重新排序的文档。
   * 文本列表或 JSON 对象列表。
   */
  documents:
    | { type: 'text'; values: string[] }
    | { type: 'object'; values: JSONObject[] };

  /**
   * 查询是一个字符串，表示用于对文档重新排序的查询。
   */
  query: string;

  /**
   * 可选限制返回的文档为前 n 个文档。
   */
  topN?: number;

  /**
   * 用于取消操作的中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV4ProviderOptions;

  /**
   * 与请求一起发送的附加 HTTP 标头。
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: SharedV4Headers;
};
