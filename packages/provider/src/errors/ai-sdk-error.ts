/**
 * 用于识别AI SDK错误实例的符号。
 * 允许跨包版本检查错误是否是 AISDKError 的实例。
 */
const marker = 'vercel.ai.error';
const symbol = Symbol.for(marker);

/**
 * AI SDK 相关错误的自定义错误类。
 * @extends Error
 */
export class AISDKError extends Error {
  private readonly [symbol] = true; // 在 isInstance 中使用

  /**
   * 错误的根本原因（如果有）。
   */
  readonly cause?: unknown;

  /**
   * 创建 AI SDK 错误。
   *
   * @param {Object} params - The parameters for creating the error.
   * @param {string} params.name - The name of the error.
   * @param {string} params.message - The error message.
   * @param {unknown} [params.cause] - The underlying cause of the error.
   */
  constructor({
    name,
    message,
    cause,
  }: {
    name: string;
    message: string;
    cause?: unknown;
  }) {
    super(message);

    this.name = name;
    this.cause = cause;
  }

  /**
   * 检查给定错误是否为 AI SDK 错误。
   * @param {unknown} error - The error to check.
   * @returns {boolean} True if the error is an AI SDK Error, false otherwise.
   */
  static isInstance(error: unknown): error is AISDKError {
    return AISDKError.hasMarker(error, marker);
  }

  protected static hasMarker(error: unknown, marker: string): boolean {
    const markerSymbol = Symbol.for(marker);
    return (
      error != null &&
      typeof error === 'object' &&
      markerSymbol in error &&
      typeof error[markerSymbol] === 'boolean' &&
      error[markerSymbol] === true
    );
  }
}
