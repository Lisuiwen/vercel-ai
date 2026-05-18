/**
 * 安排一个超时，通过`TimeoutError`中止给定的控制器
 * `DOMException`，与 `AbortSignal.timeout(ms)` 产生的原因匹配。
 *
 * @param abortController - 超时后控制器将中止。
 * 如果未定义，则不会安排超时。
 * @param label - 错误消息中包含人类可读的标签
 * （例如“步骤”、“块”）。
 * @param timeoutMs - 控制器中止之前的持续时间（以毫秒为单位）。
 * 如果未定义，则不会安排超时。
 * @returns 超时 ID（适合传递给 `clearTimeout`），或者
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
