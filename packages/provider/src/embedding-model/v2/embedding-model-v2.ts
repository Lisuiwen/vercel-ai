import type {
  SharedV2Headers,
  SharedV2ProviderOptions,
  SharedV2ProviderMetadata,
} from '../../shared';
import type { EmbeddingModelV2Embedding } from './embedding-model-v2-embedding';

/**
 * 实现嵌入模型的嵌入模型规范
 * 接口版本2.
 *
 * VALUE 是模型可以嵌入的值的类型。
 * 这将使我们在未来超越文本嵌入，
 * 例如支持图像嵌入
 */
export type EmbeddingModelV2<VALUE> = {
  /**
   * 嵌入模型必须指定哪个嵌入模型接口
   * 它实现的版本。这将使我们能够发展嵌入
   * 模型接口并保留向后兼容性。不同的
   * 实现版本可以作为有区别的联合来处理
   * 在我们这边。
   */
  readonly specificationVersion: 'v2';

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
  doEmbed(options: {
    /**
     * 要嵌入的值列表。
     */
    values: Array<VALUE>;

    /**
     * 用于取消操作的中止信号。
     */
    abortSignal?: AbortSignal;

    /**
     * 其他特定于提供商的选项。他们通过
     * 从 AI SDK 发送给提供商并启用特定于提供商的
     * 可以完全封装在提供者中的功能。
     */
    providerOptions?: SharedV2ProviderOptions;

    /**
     * 与请求一起发送的附加 HTTP 标头。
     * 仅适用于基于 HTTP 的提供商。
     */
    headers?: Record<string, string | undefined>;
  }): PromiseLike<{
    /**
     * 生成的嵌入。它们的顺序与输入值相同。
     */
    embeddings: Array<EmbeddingModelV2Embedding>;

    /**
     * 代币使用。我们只有用于嵌入的输入标记。
     */
    usage?: { tokens: number };

    /**
     * 其他特定于提供商的元数据。他们通过
     * 从提供商到 AI SDK 并启用提供商特定的
     * 可以完全封装在提供者中的结果。
     */
    providerMetadata?: SharedV2ProviderMetadata;

    /**
     * 用于调试目的的可选响应信息。
     */
    response?: {
      /**
       * 响应标头。
       */
      headers?: SharedV2Headers;

      /**
       * 响应主体。
       */
      body?: unknown;
    };
  }>;
};
