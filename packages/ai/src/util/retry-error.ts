import { AISDKError } from '@ai-sdk/provider';

const name = 'AI_RetryError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export type RetryErrorReason =
  | 'maxRetriesExceeded'
  | 'errorNotRetryable'
  | 'abort';

export class RetryError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  // 注意：属性顺序决定调试输出
  readonly reason: RetryErrorReason;
  readonly lastError: unknown;
  readonly errors: Array<unknown>;

  constructor({
    message,
    reason,
    errors,
  }: {
    message: string;
    reason: RetryErrorReason;
    errors: Array<unknown>;
  }) {
    super({ name, message });

    this.reason = reason;
    this.errors = errors;

    // 分离我们最后一个错误，以便通过日志进行调试更容易：
    this.lastError = errors[errors.length - 1];
  }

  static isInstance(error: unknown): error is RetryError {
    return AISDKError.hasMarker(error, marker);
  }
}
