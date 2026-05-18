import { filterNullable } from '@ai-sdk/provider-utils';

/**
 * 将多个中止源合并为单个`AbortSignal`。
 * 当任何输入信号中止或任何
 * 数字超时过去，使用第一个源中的原因来中止。
 *
 * @param signals - 中止信号或超时持续时间（以毫秒为单位）。
 * `null` 和 `undefined` 值将被忽略。
 * @returns 当任何有效源中止时中止的`AbortSignal`，
 * 如果未提供有效来源，则为“未定义”。
 */
export function mergeAbortSignals(
  ...signals: (AbortSignal | null | undefined | number)[]
): AbortSignal | undefined {
  const validSignals = filterNullable(...signals).map(signal =>
    signal instanceof AbortSignal ? signal : AbortSignal.timeout(signal),
  );

  return validSignals.length === 0
    ? undefined
    : validSignals.length === 1
      ? validSignals[0]
      : AbortSignal.any(validSignals);
}
