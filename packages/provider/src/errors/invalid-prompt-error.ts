import { AISDKError } from './ai-sdk-error';

const name = 'AI_InvalidPromptError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 提示无效。当提供者无法执行此操作时，应抛出此错误
 * 处理提示。
 */
export class InvalidPromptError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly prompt: unknown;

  constructor({
    prompt,
    message,
    cause,
  }: {
    prompt: unknown;
    message: string;
    cause?: unknown;
  }) {
    super({ name, message: `Invalid prompt: ${message}`, cause });

    this.prompt = prompt;
  }

  static isInstance(error: unknown): error is InvalidPromptError {
    return AISDKError.hasMarker(error, marker);
  }
}
