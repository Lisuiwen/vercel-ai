/**
 * 计算每秒令牌数的令牌率。
 *
 * 当令牌计数未知、持续时间未知或 0 时返回 0，或者
 * 计算出的速率不能表示为有限的JSON安全数。
 */
export function calculateTokensPerSecond({
  tokens,
  durationMs,
}: {
  tokens: number | undefined;
  durationMs: number | undefined;
}): number {
  const tokenRate = (1000 * (tokens ?? 0)) / (durationMs ?? 0);

  return Number.isFinite(tokenRate) ? tokenRate : 0;
}
