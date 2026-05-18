/**
 * 添加令牌计数，同时在两个计数均为未知总数时保留未知总数
 * 未知。
 */
export function sumTokenCounts(
  tokenCount1: number | undefined,
  tokenCount2: number | undefined,
): number | undefined {
  return tokenCount1 == null && tokenCount2 == null
    ? undefined
    : (tokenCount1 ?? 0) + (tokenCount2 ?? 0);
}
