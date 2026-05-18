import type {
  SharedV3Headers,
  SharedV3ProviderMetadata,
  SharedV3Warning,
} from '../../shared/v3/';
import type { RerankingModelV3CallOptions } from './reranking-model-v3-call-options';

/**
 * 实现重新排序模型接口版本 3 的重新排序模型规范。
 */
export type RerankingModelV3 = {
  /**
   * 重排序模型必须指定它实现的重排序模型接口版本。
   */
  readonly specificationVersion: 'v3';

  /**
   * 提供商 ID。
   */
  readonly provider: string;

  /**
   * 提供商特定的模型 ID。
   */
  readonly modelId: string;

  /**
   * 使用查询对文档列表重新排序。
   */
  // 命名：“do”前缀，防止用户意外直接使用该方法。
  doRerank(options: RerankingModelV3CallOptions): PromiseLike<{
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
    providerMetadata?: SharedV3ProviderMetadata;

    /**
     * 通话警告，例如不支持的设置。
     */
    warnings?: Array<SharedV3Warning>;

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
      headers?: SharedV3Headers;

      /**
       * 响应体。
       */
      body?: unknown;
    };
  }>;
};
