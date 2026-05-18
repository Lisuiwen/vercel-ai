import type {
  SpeechModelV2,
  SpeechModelV3,
  SpeechModelV4,
} from '@ai-sdk/provider';

/**
 * AI SDK使用的语音模型。
 */
export type SpeechModel =
  | string
  | SpeechModelV4
  | SpeechModelV3
  | SpeechModelV2;
