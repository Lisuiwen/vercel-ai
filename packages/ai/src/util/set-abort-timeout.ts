/**
 * 安排一个超时，通过“TimeoutError”中止给定的控制器
 * `DOMException`，与 `AbortSignal.timeout(ms)` 产生的原因匹配。
 *
 * @param abortController - The controller to abort when the timeout elapses.
 * 如果未定义，则不会安排超时。
 * @param label - Human-readable label included in the error message
 * （例如“步骤”、“块”）。
 * @param timeoutMs - Duration in milliseconds before the controller is aborted.
 * 如果未定义，则不会安排超时。
 * @returns The timeout id (suitable for passing to `clearTimeout`), or
 * 如果没有安排超时，则为“未定义”。
 */
export function setAbortTimeout({
  abortController,
  label,
  timeoutMs,
}: {
  abortController: AbortController | undefined;
  label: string;
  timeoutMs: number | undefined;
}): ReturnType<typeof setTimeout> | undefined {
  if (abortController == null || timeoutMs == null) {
    return undefined;
  }

  return setTimeout(
    () =>
      abortController.abort(
        new DOMException(
          `${label} timeout of ${timeoutMs}ms exceeded`,
          'TimeoutError',
        ),
      ),
    timeoutMs,
  );
}
