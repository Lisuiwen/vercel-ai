import { AISDKError } from './ai-sdk-error';

const name = 'AI_InvalidArgumentError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 函数参数无效。
 */
export class InvalidArgumentError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly argument: string;

  constructor({
    message,
    cause,
    argument,
  }: {
    argument: string;
    message: string;
    cause?: unknown;
  }) {
    super({ name, message, cause });

    this.argument = argument;
  }

  static isInstance(error: unknown): error is InvalidArgumentError {
    return AISDKError.hasMarker(error, marker);
  }
}
