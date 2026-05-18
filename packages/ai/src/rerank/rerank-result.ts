import type { ProviderMetadata } from '../types/provider-metadata';

/**
 * `rerank`调用的结果。
 * 它包含原始文档、重新排序的文档和附加信息。
 */
export interface RerankResult<VALUE> {
  /**
   * 重新排序的原始文档。
   */
  readonly originalDocuments: Array<VALUE>;

  /**
   * 重新排列文档。
   *
   * 按相关性得分降序排序。
   *
   * 如果有topN个限制，则可以小于原始文档。
   */
  readonly rerankedDocuments: Array<VALUE>;

  /**
   * 排名是具有原始索引的对象列表，
   * 相关性得分和重新排序的文档。
   *
   * 按相关性得分降序排序。
   *
   * 如果有topN个限制，则可以小于原始文档。
   */
  readonly ranking: Array<{
    originalIndex: number;
    score: number;
    document: VALUE;
  }>;

  /**
   * 可选的特定于提供商的元数据。
   */
  readonly providerMetadata?: ProviderMetadata;

  /**
   * 可选的原始响应数据。
   */
  readonly response: {
    /**
     * 生成的响应的ID（如果开始发送响应）。
     */
    id?: string;

    /**
     * 生成的响应的时间戳。
     */
    timestamp: Date;

    /**
     * 用于生成响应的模型的ID。
     */
    modelId: string;

    /**
     * 响应标头。
     */
    headers?: Record<string, string>;

    /**
     * 响应主体。
     */
    body?: unknown;
  };
}
