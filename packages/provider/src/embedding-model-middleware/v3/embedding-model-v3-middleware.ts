import type { EmbeddingModelV3 } from '../../embedding-model/v3/embedding-model-v3';
import type { EmbeddingModelV3CallOptions } from '../../embedding-model/v3/embedding-model-v3-call-options';

/**
 * EmbeddingModelV3 的中间件。
 * 该类型定义了可用于修改的中间件的结构
 * EmbeddingModelV3 操作的行为。
 */
export type EmbeddingModelV3Middleware = {
  /**
   * 中间件规范版本。当前版本使用“v3”。
   */
  readonly specificationVersion: 'v3';

  /**
   * 如果需要，可以覆盖提供者名称。
   * @param options.model - The embedding model instance.
   */
  overrideProvider?: (options: { model: EmbeddingModelV3 }) => string;

  /**
   * 如果需要，可以覆盖模型 ID。
   * @param options.model - The embedding model instance.
   */
  overrideModelId?: (options: { model: EmbeddingModelV3 }) => string;

  /**
   * 如果需要，可以覆盖单个 API 调用中可以生成的嵌入数量的限制。
   * @param options.model - The embedding model instance.
   */
  overrideMaxEmbeddingsPerCall?: (options: {
    model: EmbeddingModelV3;
  }) => PromiseLike<number | undefined> | number | undefined;

  /**
   * 如果需要，可以覆盖对并行处理多个嵌入调用的支持。
   * @param options.model - The embedding model instance.
   */
  overrideSupportsParallelCalls?: (options: {
    model: EmbeddingModelV3;
  }) => PromiseLike<boolean> | boolean;

  /**
   * 在将参数传递到嵌入模型之前对其进行转换。
   * @param options - Object containing the type of operation and the parameters.
   * @param options.params - The original parameters for the embedding model call.
   * @returns A promise that resolves to the transformed parameters.
   */
  transformParams?: (options: {
    params: EmbeddingModelV3CallOptions;
    model: EmbeddingModelV3;
  }) => PromiseLike<EmbeddingModelV3CallOptions>;

  /**
   * 包装嵌入模型的嵌入操作。
   *
   * @param options - Object containing the embed function, parameters, and model.
   * @param options.doEmbed - The original embed function.
   * @param options.params - The parameters for the embed call. If the
   * 使用“transformParams”中间件，这将是转换后的参数。
   * @param options.model - The embedding model instance.
   * @returns A promise that resolves to the result of the generate operation.
   */
  wrapEmbed?: (options: {
    doEmbed: () => ReturnType<EmbeddingModelV3['doEmbed']>;
    params: EmbeddingModelV3CallOptions;
    model: EmbeddingModelV3;
  }) => Promise<Awaited<ReturnType<EmbeddingModelV3['doEmbed']>>>;
};
