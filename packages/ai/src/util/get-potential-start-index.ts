/**
 * 查找 searchedText 可以在文本中开始的潜在起始索引。
 *
 * 此函数检查完整匹配和部分匹配：
 * - 如果发现 searchedText 是完整的子字符串，则返回第一次出现的索引。
 * - 如果文本的结尾与 searchedText 的开头匹配（部分匹配），
 *   返回部分匹配开始的索引。
 *
 * @param text - 要在其中搜索的文本。
 * @param searchedText - 要搜索的文本。
 * @returns 匹配的起始索引（完整或部分），如果为 null
 * searchedText 为空或未找到匹配项。
 */
export function getPotentialStartIndex(
  text: string,
  searchedText: string,
): number | null {
  // 如果searchedText为空，则立即返回null。
  if (searchedText.length === 0) {
    return null;
  }

  // 检查 searchedText 是否作为文本的直接子字符串存在。
  const directIndex = text.indexOf(searchedText);
  if (directIndex !== -1) {
    return directIndex;
  }

  // 否则，查找匹配的“文本”的最大后缀
  // `searchedText`的附件。我们从文本消耗向内看。
  for (let i = text.length - 1; i >= 0; i--) {
    const suffix = text.substring(i);
    if (searchedText.startsWith(suffix)) {
      return i;
    }
  }

  return null;
}
