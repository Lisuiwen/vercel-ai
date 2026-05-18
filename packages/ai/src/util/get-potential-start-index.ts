/**
 * 查找 searchedText 可以在文本中开始的潜在起始索引。
 *
 * 此函数检查完整匹配和部分匹配：
 * - 如果发现 searchedText 是完整的子字符串，则返回第一次出现的索引。
 * - 如果文本的结尾与 searchedText 的开头匹配（部分匹配），
 *   返回部分匹配开始的索引。
 *
 * @param text - The text to search within.
 * @param searchedText - The text to search for.
 * @returns The starting index of the match (complete or partial), or null if
 *          searchedText 为空或未找到匹配项。
 */
export function getPotentialStartIndex(
  text: string,
  searchedText: string,
): number | null {
  // 如果 searchedText 为空，则立即返回 null。
  if (searchedText.length === 0) {
    return null;
  }

  // 检查 searchedText 是否作为文本的直接子字符串存在。
  const directIndex = text.indexOf(searchedText);
  if (directIndex !== -1) {
    return directIndex;
  }

  // 否则，查找匹配的“文本”的最大后缀
  // “searchedText”的前缀。我们从文本末尾向内看。
  for (let i = text.length - 1; i >= 0; i--) {
    const suffix = text.substring(i);
    if (searchedText.startsWith(suffix)) {
      return i;
    }
  }

  return null;
}
