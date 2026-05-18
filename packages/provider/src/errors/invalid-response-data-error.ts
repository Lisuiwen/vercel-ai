import { AISDKError } from './ai-sdk-error';

const name = 'AI_InvalidResponseDataError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 服务器返回了包含无效数据内容的响应。
 * 当提供商无法解析来自 API 的响应时，应该抛出此错误。
 */
export class InvalidResponseDataError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly data: unknown;

  constructor({
    data,
    message = `Invalid response data: ${JSON.stringify(data)}.`,
  }: {
    data: unknown;
    message?: string;
  }) {
    super({ name, message });

    this.data = data;
  }

  static isInstance(error: unknown): error is InvalidResponseDataError {
    return AISDKError.hasMarker(error, marker);
  }
}
