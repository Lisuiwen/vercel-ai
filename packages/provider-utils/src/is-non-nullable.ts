/**
 * 检查值是否不为“null”或“undefined”的类型保护。
 *
 * @template T - The type of the value to check.
 * @param value - The value to check.
 * @returns `true` if the value is neither `null` nor `undefined`, otherwise `false`.
 */
export function isNonNullable<T>(
  value: T | undefined | null,
): value is NonNullable<T> {
  return value != null;
}
