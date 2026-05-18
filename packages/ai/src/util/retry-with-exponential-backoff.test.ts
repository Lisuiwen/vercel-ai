import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APICallError } from '@ai-sdk/provider';
import {
  GatewayInternalServerError,
  GatewayRateLimitError,
  GatewayAuthenticationError,
} from '@ai-sdk/gateway';
import { retryWithExponentialBackoffRespectingRetryHeaders } from './retry-with-exponential-backoff';

describe('retryWithExponentialBackoffRespectingRetryHeaders', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use rate limit header delay when present and reasonable', async () => {
    let attempt = 0;
    const retryAfterMs = 3000;

    const fn = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        throw new APICallError({
          message: 'Rate limited',
          url: 'https://api.example.com',
          requestBodyValues: {},
          isRetryable: true,
          data: undefined,
          responseHeaders: {
            'retry-after-ms': retryAfterMs.toString(),
          },
        });
      }
      return 'success';
    });

    const promise = retryWithExponentialBackoffRespectingRetryHeaders()(fn);

    // 应使用速率限制延迟（3000ms）
    await vi.advanceTimersByTimeAsync(retryAfterMs - 100);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(2);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should parse retry-after header in seconds', async () => {
    let attempt = 0;
    const retryAfterSeconds = 5;

    const fn = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        throw new APICallError({
          message: 'Rate limited',
          url: 'https://api.example.com',
          requestBodyValues: {},
          isRetryable: true,
          data: undefined,
          responseHeaders: {
            'retry-after': retryAfterSeconds.toString(),
          },
        });
      }
      return 'success';
    });

    const promise = retryWithExponentialBackoffRespectingRetryHeaders()(fn);

    // 快进到重试延迟之前
    await vi.advanceTimersByTimeAsync(retryAfterSeconds * 1000 - 100);
    expect(fn).toHaveBeenCalledTimes(1);

    // 快进超过重试延迟
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(2);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should use exponential backoff when rate limit delay is too long', async () => {
    let attempt = 0;
    const retryAfterMs = 70000; // 70 秒——太长
    const initialDelay = 2000; // 默认指数退避

    const fn = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        throw new APICallError({
          message: 'Rate limited',
          url: 'https://api.example.com',
          requestBodyValues: {},
          isRetryable: true,
          data: undefined,
          responseHeaders: {
            'retry-after-ms': retryAfterMs.toString(),
          },
        });
      }
      return 'success';
    });

    const promise = retryWithExponentialBackoffRespectingRetryHeaders({
      initialDelayInMs: initialDelay,
    })(fn);

    // 应使用指数退避延迟（2000ms）而不是速率限制（70000ms）
    await vi.advanceTimersByTimeAsync(initialDelay - 100);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(2);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should fall back to exponential backoff when no rate limit headers', async () => {
    let attempt = 0;
    const initialDelay = 2000;

    const fn = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        throw new APICallError({
          message: 'Temporary error',
          url: 'https://api.example.com',
          requestBodyValues: {},
          isRetryable: true,
          data: undefined,
          responseHeaders: {},
        });
      }
      return 'success';
    });

    const promise = retryWithExponentialBackoffRespectingRetryHeaders({
      initialDelayInMs: initialDelay,
    })(fn);

    // 快进到初始延迟之前
    await vi.advanceTimersByTimeAsync(initialDelay - 100);
    expect(fn).toHaveBeenCalledTimes(1);

    // 快进超过初始延迟
    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(2);

    const result = await promise;
    expect(result).toBe('success');
  });

  it('should handle invalid rate limit header values', async () => {
    let attempt = 0;
    const initialDelay = 2000;

    const fn = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        throw new APICallError({
          message: 'Rate limited',
          url: 'https://api.example.com',
          requestBodyValues: {},
          isRetryable: true,
          data: undefined,
          responseHeaders: {
            'retry-after-ms': 'invalid',
            'retry-after': 'not-a-number',
          },
        });
      }
      return 'success';
    });

    const promise = retryWithExponentialBackoffRespectingRetryHeaders({
      initialDelayInMs: initialDelay,
    })(fn);

    // 应该回退到指数退避延迟
    await vi.advanceTimersByTimeAsync(initialDelay - 100);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    expect(fn).toHaveBeenCalledTimes(2);

    const result = await promise;
    expect(result).toBe('success');
  });

  describe('with mocked provider responses', () => {
    it('should handle Anthropic 429 response with retry-after-ms header', async () => {
      let attempt = 0;
      const delayMs = 5000;

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          // 使用 retry-after-ms 模拟实际的 Anthropic 429 响应
          throw new APICallError({
            message: 'Rate limit exceeded',
            url: 'https://api.anthropic.com/v1/messages',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: true,
            data: {
              error: {
                type: 'rate_limit_error',
                message: 'Rate limit exceeded',
              },
            },
            responseHeaders: {
              'retry-after-ms': delayMs.toString(),
              'x-request-id': 'req_123456',
            },
          });
        }
        return { content: 'Hello from Claude!' };
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders()(fn);

      // 应该使用 retry-after-ms 标头的延迟
      await vi.advanceTimersByTimeAsync(delayMs - 100);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toEqual({ content: 'Hello from Claude!' });
    });

    it('should handle OpenAI 429 response with retry-after header', async () => {
      let attempt = 0;
      const delaySeconds = 30; // 30秒

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          // 使用 retry-after 模拟实际的 OpenAI 429 响应
          throw new APICallError({
            message: 'Rate limit reached for requests',
            url: 'https://api.openai.com/v1/chat/completions',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: true,
            data: {
              error: {
                message: 'Rate limit reached for requests',
                type: 'requests',
                param: null,
                code: 'rate_limit_exceeded',
              },
            },
            responseHeaders: {
              'retry-after': delaySeconds.toString(),
              'x-request-id': 'req_abcdef123456',
            },
          });
        }
        return { choices: [{ message: { content: 'Hello from GPT!' } }] };
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders()(fn);

      // 应使用重试后标头的延迟（30 秒）
      await vi.advanceTimersByTimeAsync(delaySeconds * 1000 - 100);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toEqual({
        choices: [{ message: { content: 'Hello from GPT!' } }],
      });
    });

    it('should handle multiple retries with exponential backoff progression', async () => {
      let attempt = 0;
      const baseTime = 1700000000000;

      vi.setSystemTime(baseTime);

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          // 第一次尝试：5 秒速率限制延迟
          throw new APICallError({
            message: 'Rate limited',
            url: 'https://api.anthropic.com/v1/messages',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: true,
            data: undefined,
            responseHeaders: {
              'retry-after-ms': '5000',
            },
          });
        } else if (attempt === 2) {
          // 第二次尝试：2 秒速率限制延迟，但指数退避时间为 4 秒
          throw new APICallError({
            message: 'Rate limited',
            url: 'https://api.anthropic.com/v1/messages',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: true,
            data: undefined,
            responseHeaders: {
              'retry-after-ms': '2000',
            },
          });
        }
        return { content: 'Success after retries!' };
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders({
        maxRetries: 3,
      })(fn);

      // 第一次重试 - 使用速率限制延迟（5000ms）
      await vi.advanceTimersByTimeAsync(5000);
      expect(fn).toHaveBeenCalledTimes(2);

      // 第二次重试 - 使用指数退避(4000ms)，大于延迟限制延迟(2000ms)
      await vi.advanceTimersByTimeAsync(4000);
      expect(fn).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toEqual({ content: 'Success after retries!' });
    });

    it('should prefer retry-after-ms over retry-after when both present', async () => {
      let attempt = 0;

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new APICallError({
            message: 'Rate limited',
            url: 'https://api.example.com/v1/messages',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: true,
            data: undefined,
            responseHeaders: {
              'retry-after-ms': '3000', // 3秒-应该使用这个
              'retry-after': '10', // 10 秒 - 应该忽略
            },
          });
        }
        return 'success';
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders()(fn);

      // 应使用 3 秒延迟重试毫秒后
      await vi.advanceTimersByTimeAsync(3000);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle retry-after header with HTTP date format', async () => {
      let attempt = 0;
      const baseTime = 1700000000000;
      const delayMs = 5000;

      vi.setSystemTime(baseTime);

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          const futureDate = new Date(baseTime + delayMs).toUTCString();
          throw new APICallError({
            message: 'Rate limit exceeded',
            url: 'https://api.example.com/v1/endpoint',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: true,
            data: undefined,
            responseHeaders: {
              'retry-after': futureDate,
            },
          });
        }
        return { data: 'success' };
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders()(fn);

      await vi.advanceTimersByTimeAsync(0);
      expect(fn).toHaveBeenCalledTimes(1);

      // 应等待 5 秒
      await vi.advanceTimersByTimeAsync(delayMs - 100);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toEqual({ data: 'success' });
    });

    it('should fall back to exponential backoff when rate limit delay is negative', async () => {
      let attempt = 0;
      const initialDelay = 2000;

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new APICallError({
            message: 'Rate limited',
            url: 'https://api.example.com',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: true,
            data: undefined,
            responseHeaders: {
              'retry-after-ms': '-1000', // 负值
            },
          });
        }
        return 'success';
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders({
        initialDelayInMs: initialDelay,
      })(fn);

      // 应使用指数退避延迟（2000ms）而不是负速率限制
      await vi.advanceTimersByTimeAsync(initialDelay - 100);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('with Gateway errors', () => {
    it('should retry on GatewayInternalServerError', async () => {
      let attempt = 0;
      const initialDelay = 2000;

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new GatewayInternalServerError({
            message: 'Internal server error',
            statusCode: 503,
          });
        }
        return 'success';
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders({
        initialDelayInMs: initialDelay,
      })(fn);

      await vi.advanceTimersByTimeAsync(initialDelay - 100);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should retry on GatewayRateLimitError', async () => {
      let attempt = 0;
      const initialDelay = 2000;

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new GatewayRateLimitError({
            message: 'Rate limit exceeded',
          });
        }
        return 'success';
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders({
        initialDelayInMs: initialDelay,
      })(fn);

      await vi.advanceTimersByTimeAsync(initialDelay - 100);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should not retry on non-retryable GatewayAuthenticationError', async () => {
      const fn = vi.fn().mockImplementation(async () => {
        throw new GatewayAuthenticationError({
          message: 'Invalid API key',
        });
      });

      await expect(
        retryWithExponentialBackoffRespectingRetryHeaders()(fn),
      ).rejects.toThrow('Invalid API key');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use retry-after headers from APICallError cause', async () => {
      let attempt = 0;
      const retryAfterMs = 3000;

      const fn = vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          const apiError = new APICallError({
            message: 'Service unavailable',
            url: 'https://api.example.com',
            requestBodyValues: {},
            statusCode: 503,
            isRetryable: true,
            responseHeaders: {
              'retry-after-ms': retryAfterMs.toString(),
            },
          });

          throw new GatewayInternalServerError({
            message: 'Internal server error',
            statusCode: 503,
            cause: apiError,
          });
        }
        return 'success';
      });

      const promise = retryWithExponentialBackoffRespectingRetryHeaders()(fn);

      await vi.advanceTimersByTimeAsync(retryAfterMs - 100);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(2);

      const result = await promise;
      expect(result).toBe('success');
    });
  });
});
