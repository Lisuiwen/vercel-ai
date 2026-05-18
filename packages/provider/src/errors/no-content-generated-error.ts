import { AISDKError } from './ai-sdk-error';

const name = 'AI_NoContentGeneratedError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 当 AI 提供者无法生成任何内容时抛出。
 */
export class NoContentGeneratedError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  constructor({
    message = 'No content generated.',
  }: { message?: string } = {}) {
    super({ name, message });
  }

  static isInstance(error: unknown): error is NoContentGeneratedError {
    return AISDKError.hasMarker(error, marker);
  }
}
