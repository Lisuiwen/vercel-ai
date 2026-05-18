import { AISDKError } from '@ai-sdk/provider';

const name = 'AI_NoOutputGeneratedError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 当没有生成LLM输出时推送，例如因为错误。
 */
export class NoOutputGeneratedError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  constructor({
    message = 'No output generated.',
    cause,
  }: {
    message?: string;
    cause?: Error;
  } = {}) {
    super({ name, message, cause });
  }

  static isInstance(error: unknown): error is NoOutputGeneratedError {
    return AISDKError.hasMarker(error, marker);
  }
}
