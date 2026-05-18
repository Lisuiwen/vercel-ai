import { AISDKError } from '@ai-sdk/provider';
import type { VideoModelResponseMetadata } from '../types/video-model-response-metadata';

const name = 'AI_NoVideoGeneratedError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class NoVideoGeneratedError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly responses: Array<VideoModelResponseMetadata>;

  constructor({
    message = 'No video generated.',
    cause,
    responses,
  }: {
    message?: string;
    cause?: unknown;
    responses: Array<VideoModelResponseMetadata>;
  }) {
    super({ name, message, cause });

    this.responses = responses;
  }

  static isInstance(error: unknown): error is NoVideoGeneratedError {
    return AISDKError.hasMarker(error, marker);
  }

  /**
   * @deprecated 使用`isInstance`代替
   */
  static isNoVideoGeneratedError(
    error: unknown,
  ): error is NoVideoGeneratedError {
    return error instanceof Error &&
      error.name === name &&
      typeof (error as NoVideoGeneratedError).responses !== 'undefined'
      ? true
      : false;
  }

  /**
   * @deprecated 不要使用此方法。将在下一个主要版本中删除。
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,

      cause: this.cause,
      responses: this.responses,
    };
  }
}
