import { InvalidArgumentError } from '../error/invalid-argument-error';
import {
  retryWithExponentialBackoffRespectingRetryHeaders,
  type RetryFunction,
} from '../util/retry-with-exponential-backoff';
/**
 * 验证并准备重试。
 */
export function prepareRetries({
  maxRetries,
  abortSignal,
}: {
  maxRetries: number | undefined;
  abortSignal: AbortSignal | undefined;
}): {
  maxRetries: number;
  retry: RetryFunction;
} {
  if (maxRetries != null) {
    if (!Number.isInteger(maxRetries)) {
      throw new InvalidArgumentError({
        parameter: 'maxRetries',
        value: maxRetries,
        message: 'maxRetries must be an integer',
      });
    }

    if (maxRetries < 0) {
      throw new InvalidArgumentError({
        parameter: 'maxRetries',
        value: maxRetries,
        message: 'maxRetries must be >= 0',
      });
    }
  }

  const maxRetriesResult = maxRetries ?? 2;

  return {
    maxRetries: maxRetriesResult,
    retry: retryWithExponentialBackoffRespectingRetryHeaders({
      maxRetries: maxRetriesResult,
      abortSignal,
    }),
  };
}
