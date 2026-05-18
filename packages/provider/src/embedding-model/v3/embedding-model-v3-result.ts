import type {
  SharedV3Headers,
  SharedV3ProviderMetadata,
  SharedV3Warning,
} from '../../shared';
import type { EmbeddingModelV3Embedding } from './embedding-model-v3-embedding';

/**
 * 嵌入模型 doEmbed 调用的结果。
 */
export type EmbeddingModelV3Result = {
  /**
   * 生成的嵌入。它们的顺序与输入值相同。
   */
  embeddings: Array<EmbeddingModelV3Embedding>;

  /**
   * 代币使用。我们只有用于嵌入的输入标记。
   */
  usage?: { tokens: number };

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从提供商到 AI SDK 并启用提供商特定的
   * 可以完全封装在提供者中的结果。
   */
  providerMetadata?: SharedV3ProviderMetadata;

  /**
   * 用于调试目的的可选响应信息。
   */
  response?: {
    /**
     * 响应标头。
     */
    headers?: SharedV3Headers;

    /**
     * 响应主体。
     */
    body?: unknown;
  };

  /**
   * 通话警告，例如不支持的设置。
   */
  warnings: Array<SharedV3Warning>;
};
