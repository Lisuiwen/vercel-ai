import type { EmbeddingModelV3CallOptions } from './embedding-model-v3-call-options';
import type { EmbeddingModelV3Result } from './embedding-model-v3-result';

/**
 * 实现嵌入模型的嵌入模型规范
 * 接口版本3.
 *
 * 它特定于文本嵌入。
 */
export type EmbeddingModelV3 = {
  /**
   * 嵌入模型必须指定哪个嵌入模型接口
   * 它实现的版本。这将使我们能够发展嵌入
   * 模型接口并保留向后兼容性。不同的
   * 实现版本可以作为有区别的联合来处理
   * 在我们这边。
   */
  readonly specificationVersion: 'v3';

  /**
   * 用于记录目的的提供商名称。
   */
  readonly provider: string;

  /**
   * Provider-specific model ID for logging purposes.
   */
  readonly modelId: string;

  /**
   * 单个 API 调用中可以生成的嵌入数量的限制。
   *
   * 对于没有限制的模型使用 Infinity。
   */
  readonly maxEmbeddingsPerCall:
    | PromiseLike<number | undefined>
    | number
    | undefined;

  /**
   * 如果模型可以并行处理多个嵌入调用，则为 true。
   */
  readonly supportsParallelCalls: PromiseLike<boolean> | boolean;

  /**
   * 生成给定输入文本的嵌入列表。
   *
   * 命名：“do”前缀，防止意外直接使用该方法
   * 由用户。
   */
  doEmbed(
    options: EmbeddingModelV3CallOptions,
  ): PromiseLike<EmbeddingModelV3Result>;
};
