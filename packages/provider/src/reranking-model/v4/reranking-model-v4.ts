import type { RerankingModelV4CallOptions } from './reranking-model-v4-call-options';
import type { RerankingModelV4Result } from './reranking-model-v4-result';

/**
 * 实现重新排序模型接口版本 3 的重新排序模型规范。
 */
export type RerankingModelV4 = {
  /**
   * 重排序模型必须指定它实现的重排序模型接口版本。
   */
  readonly specificationVersion: 'v4';

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
  doRerank(
    options: RerankingModelV4CallOptions,
  ): PromiseLike<RerankingModelV4Result>;
};
