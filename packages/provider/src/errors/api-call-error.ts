import { AISDKError } from './ai-sdk-error';

const name = 'AI_APICallError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class APICallError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly url: string;
  readonly requestBodyValues: unknown;
  readonly statusCode?: number;

  readonly responseHeaders?: Record<string, string>;
  readonly responseBody?: string;

  readonly isRetryable: boolean;
  readonly data?: unknown;

  constructor({
    message,
    url,
    requestBodyValues,
    statusCode,
    responseHeaders,
    responseBody,
    cause,
    isRetryable = statusCode != null &&
      (statusCode === 408 || // 请求超时
        statusCode === 409 || // 冲突
        statusCode === 429 || // 请求太多
        statusCode >= 500), // 服务器错误
    data,
  }: {
    message: string;
    url: string;
    requestBodyValues: unknown;
    statusCode?: number;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
    cause?: unknown;
    isRetryable?: boolean;
    data?: unknown;
  }) {
    super({ name, message, cause });

    this.url = url;
    this.requestBodyValues = requestBodyValues;
    this.statusCode = statusCode;
    this.responseHeaders = responseHeaders;
    this.responseBody = responseBody;
    this.isRetryable = isRetryable;
    this.data = data;
  }

  static isInstance(error: unknown): error is APICallError {
    return AISDKError.hasMarker(error, marker);
  }
}
