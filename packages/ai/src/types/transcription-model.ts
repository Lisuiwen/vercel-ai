import type {
  TranscriptionModelV2,
  TranscriptionModelV3,
  TranscriptionModelV4,
} from '@ai-sdk/provider';

/**
 * AI SDK使用的会计模型。
 */
export type TranscriptionModel =
  | string
  | TranscriptionModelV4
  | TranscriptionModelV3
  | TranscriptionModelV2;
