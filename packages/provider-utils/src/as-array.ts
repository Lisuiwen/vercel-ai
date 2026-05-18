/**
 * 可以作为单个项目、项目数组提供的值，
 * 或保持未定义。
 */
export type Arrayable<T> = T | T[] | undefined;

/**
 * 将可能未定义或非数组的值标准化为数组。
 */
export function asArray<T>(value: Arrayable<T>): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
