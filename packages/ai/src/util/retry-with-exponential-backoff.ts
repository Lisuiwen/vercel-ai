import { APICallError } from '@ai-sdk/provider';
import { GatewayError } from '@ai-sdk/gateway';
import { delay, getErrorMessage, isAbortError } from '@ai-sdk/provider-utils';
import { RetryError } from './retry-error';

export type RetryFunction = <OUTPUT>(
  fn: () => PromiseLike<OUTPUT>,
) => PromiseLike<OUTPUT>;

function getRetryDelayInMs({
  error,
  exponentialBackoffDelay,
}: {
  error: APICallError | GatewayError;
  exponentialBackoffDelay: number;
}): number {
  const headers = APICallError.isInstance(error)
    ? error.responseHeaders
    : APICallError.isInstance(error.cause)
      ? (error.cause as APICallError).responseHeaders
      : undefined;

  if (!headers) return exponentialBackoffDelay;

  let ms: number | undefined;

  // retry-ms 比 retry-after 更准确，例如被使用开放人工智能
  const retryAfterMs = headers['retry-after-ms'];
  if (retryAfterMs) {
    const timeoutMs = parseFloat(retryAfterMs);
    if (!Number.isNaN(timeoutMs)) {
      ms = timeoutMs;
    }
  }

  // 关于 Retry-After 标头：https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
  const retryAfter = headers['retry-after'];
  if (retryAfter && ms === undefined) {
    const timeoutSeconds = parseFloat(retryAfter);
    if (!Number.isNaN(timeoutSeconds)) {
      ms = timeoutSeconds * 1000;
    } else {
      ms = Date.parse(retryAfter) - Date.now();
    }
  }

  // 检查延迟是否合理：
  if (
    ms != null &&
    !Number.isNaN(ms) &&
    0 <= ms &&
    (ms < 60 * 1000 || ms < exponentialBackoffDelay)
  ) {
    return ms;
  }

  return exponentialBackoffDelay;
}

/**
 * `retryWithExponentialBackoffRespectingRetryHeaders` 策略使用指数退避重试失败的 API 调用，
 * 同时尊重速率限制标头（retry-after-ms 和 retry-after）（如果提供且合理）（0-60 秒）。
 * 您可以配置最大重试次数、初始延迟和退避因子。
 */
export const retryWithExponentialBackoffRespectingRetryHeaders =
  ({
    maxRetries = 2,
    initialDelayInMs = 2000,
    backoffFactor = 2,
    abortSignal,
  }: {
    maxRetries?: number;
    initialDelayInMs?: number;
    backoffFactor?: number;
    abortSignal?: AbortSignal;
  } = {}): RetryFunction =>
  async <OUTPUT>(f: () => PromiseLike<OUTPUT>) =>
    _retryWithExponentialBackoff(f, {
      maxRetries,
      delayInMs: initialDelayInMs,
      backoffFactor,
      abortSignal,
    });

async function _retryWithExponentialBackoff<OUTPUT>(
  f: () => PromiseLike<OUTPUT>,
  {
    maxRetries,
    delayInMs,
    backoffFactor,
    abortSignal,
  }: {
    maxRetries: number;
    delayInMs: number;
    backoffFactor: number;
    abortSignal: AbortSignal | undefined;
  },
  errors: unknown[] = [],
): Promise<OUTPUT> {
  try {
    return await f();
  } catch (error) {
    if (isAbortError(error)) {
      throw error; // 请求被中止时不要重试
    }

    if (maxRetries === 0) {
      throw error; // 禁用重试时不包装错误
    }

    const errorMessage = getErrorMessage(error);
    const newErrors = [...errors, error];
    const tryNumber = newErrors.length;

    if (tryNumber > maxRetries) {
      throw new RetryError({
        message: `Failed after ${tryNumber} attempts. Last error: ${errorMessage}`,
        reason: 'maxRetriesExceeded',
        errors: newErrors,
      });
    }

    if (
      error instanceof Error &&
      ((APICallError.isInstance(error) && error.isRetryable === true) ||
        (GatewayError.isInstance(error) && error.isRetryable === true)) &&
      tryNumber <= maxRetries
    ) {
      await delay(
        getRetryDelayInMs({
          error: error as APICallError | GatewayError,
          exponentialBackoffDelay: delayInMs,
        }),
        { abortSignal },
      );

      return _retryWithExponentialBackoff(
        f,
        {
          maxRetries,
          delayInMs: backoffFactor * delayInMs,
          backoffFactor,
          abortSignal,
        },
        newErrors,
      );
    }

    if (tryNumber === 1) {
      throw error; // 当第一次尝试发生不可重试的错误时，不要包装错误
    }

    throw new RetryError({
      message: `Failed after ${tryNumber} attempts with non-retryable error: '${errorMessage}'`,
      reason: 'errorNotRetryable',
      errors: newErrors,
    });
  }
}
