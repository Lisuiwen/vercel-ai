import type {
  EmbeddingModelV2,
  EmbeddingModelV3,
  EmbeddingModelV4,
  EmbeddingModelV4Embedding,
} from '@ai-sdk/provider';

/**
 * AI SDK 使用的嵌入模型。
 */
export type EmbeddingModel =
  | string
  | EmbeddingModelV4
  | EmbeddingModelV3
  | EmbeddingModelV2<string>;

/**
 * 嵌入。
 */
export type Embedding = EmbeddingModelV4Embedding;
