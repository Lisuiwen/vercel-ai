import { AISDKError } from '@ai-sdk/provider';
import type { TranscriptionModelResponseMetadata } from '../types/transcription-model-response-metadata';

const name = 'AI_NoTranscriptGeneratedError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 未生成转录本时引发的错误。
 */
export class NoTranscriptGeneratedError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly responses: Array<TranscriptionModelResponseMetadata>;

  constructor(options: {
    responses: Array<TranscriptionModelResponseMetadata>;
  }) {
    super({
      name,
      message: 'No transcript generated.',
    });

    this.responses = options.responses;
  }

  static isInstance(error: unknown): error is NoTranscriptGeneratedError {
    return AISDKError.hasMarker(error, marker);
  }
}
