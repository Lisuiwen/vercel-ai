import { AISDKError } from '@ai-sdk/provider';
import type { ImageModelResponseMetadata } from '../types/image-model-response-metadata';

const name = 'AI_NoImageGeneratedError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 当无法生成图像时抛出。这可能有多种原因：
 *
 * - 模型无法生成响应。
 * - 模型生成了无法解析的响应。
 */
export class NoImageGeneratedError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  /**
   * 每个调用的响应元数据。
   */
  readonly responses: Array<ImageModelResponseMetadata> | undefined;

  constructor({
    message = 'No image generated.',
    cause,
    responses,
  }: {
    message?: string;
    cause?: Error;
    responses?: Array<ImageModelResponseMetadata>;
  }) {
    super({ name, message, cause });

    this.responses = responses;
  }

  static isInstance(error: unknown): error is NoImageGeneratedError {
    return AISDKError.hasMarker(error, marker);
  }
}
