import type { Embedding, ProviderMetadata } from '../types';
import type { EmbeddingModelUsage } from '../types/usage';
import type { Warning } from '../types/warning';

/**
 * `embedMany`调用的结果。
 * 它包含嵌入、值和附加信息。
 */
export interface EmbedManyResult {
  /**
   * 嵌入的价值观。
   */
  readonly values: Array<string>;

  /**
   * 嵌入。它们的顺序与值相同。
   */
  readonly embeddings: Array<Embedding>;

  /**
   * 嵌入令牌的使用。
   */
  readonly usage: EmbeddingModelUsage;

  /**
   * 通话警告，例如不支持的设置。
   */
  readonly warnings: Array<Warning>;

  /**
   * 可选的特定于提供商的元数据。
   */
  readonly providerMetadata?: ProviderMetadata;

  /**
   * 可选的原始响应数据。
   */
  readonly responses?: Array<
    | {
        /**
         * 响应标头。
         */
        headers?: Record<string, string>;

        /**
         * 响应主体。
         */
        body?: unknown;
      }
    | undefined
  >;
}
