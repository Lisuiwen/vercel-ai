import type { RerankingModelV3, RerankingModelV4 } from '@ai-sdk/provider';

/**
 * AI SDK 使用的重新排名模型。
 */
export type RerankingModel = string | RerankingModelV4 | RerankingModelV3;
