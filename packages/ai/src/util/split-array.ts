/**
 * 将数组拆分为指定大小的块。
 *
 * @template T - 数组中元素的类型。
 * @param {T[]} array - 要分割的数组。
 * @param {number} chunkSize - 每个块的大小。
 * @returns {T[][]} - 包含块的新数组。
 */
export function splitArray<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0');
  }

  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }

  return result;
}
