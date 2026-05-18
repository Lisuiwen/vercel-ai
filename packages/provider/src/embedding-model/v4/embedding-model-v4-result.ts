import type {
  SharedV4Headers,
  SharedV4ProviderMetadata,
  SharedV4Warning,
} from '../../shared';
import type { EmbeddingModelV4Embedding } from './embedding-model-v4-embedding';

/**
 * 嵌入模型 doEmbed 调用的结果。
 */
export type EmbeddingModelV4Result = {
  /**
   * 生成的嵌入。它们的顺序与输入值相同。
   */
  embeddings: Array<EmbeddingModelV4Embedding>;

  /**
   * 代币使用。我们只有用于嵌入的输入标记。
   */
  usage?: { tokens: number };

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从提供商到 AI SDK 并启用提供商特定的
   * 可以完全封装在提供者中的结果。
   */
  providerMetadata?: SharedV4ProviderMetadata;

  /**
   * 用于调试目的的可选响应信息。
   */
  response?: {
    /**
     * 响应标头。
     */
    headers?: SharedV4Headers;

    /**
     * 响应主体。
     */
    body?: unknown;
  };

  /**
   * 通话警告，例如不支持的设置。
   */
  warnings: Array<SharedV4Warning>;
};
