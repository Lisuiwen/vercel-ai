/**
 * 从值列表中过滤“null”和“undefined”值。
 *
 * @param values - The values to filter.
 * @returns A new array containing only non-nullish values.
 */
export function filterNullable<T>(
  ...values: Array<T | undefined | null>
): Array<T> {
  return values.filter((value): value is NonNullable<T> => value != null);
}
