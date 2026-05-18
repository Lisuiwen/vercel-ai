import type {
  SharedV4Headers,
  SharedV4ProviderMetadata,
  SharedV4Warning,
} from '../../shared/v4/';

/**
 * 重新排序模型 doRerank 调用的结果。
 */
export type RerankingModelV4Result = {
  /**
   * 重新排序文档的有序列表（通过重新排序之前的索引）。
   * 文档按相关性分数的降序排序。
   */
  ranking: Array<{
    /**
     * 重新排序之前原始文档列表中文档的索引。
     */
    index: number;

    /**
     * 重新排序后文档的相关性得分。
     */
    relevanceScore: number;
  }>;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerMetadata?: SharedV4ProviderMetadata;

  /**
   * 通话警告，例如不支持的设置。
   */
  warnings?: Array<SharedV4Warning>;

  /**
   * 用于调试目的的可选响应信息。
   */
  response?: {
    /**
     * 生成的响应的 ID（如果提供商发送了响应）。
     */
    id?: string;

    /**
     * 生成的响应的开始时间戳（如果提供者发送响应）。
     */
    timestamp?: Date;

    /**
     * 用于生成响应的响应模型的 ID（如果提供者发送了响应模型）。
     */
    modelId?: string;

    /**
     * 响应标头。
     */
    headers?: SharedV4Headers;

    /**
     * 响应体。
     */
    body?: unknown;
  };
};
