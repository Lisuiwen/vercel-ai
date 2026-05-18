import { AISDKError } from '@ai-sdk/provider';
import type { SpeechModelResponseMetadata } from '../types/speech-model-response-metadata';

const name = 'AI_NoSpeechGeneratedError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 未生成语音音频时引发的错误。
 */
export class NoSpeechGeneratedError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly responses: Array<SpeechModelResponseMetadata>;

  constructor(options: { responses: Array<SpeechModelResponseMetadata> }) {
    super({
      name,
      message: 'No speech audio generated.',
    });

    this.responses = options.responses;
  }

  static isInstance(error: unknown): error is NoSpeechGeneratedError {
    return AISDKError.hasMarker(error, marker);
  }
}
