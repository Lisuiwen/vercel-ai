import { normalizeHeaders } from './normalize-headers';

/**
 * 将后缀部分附加到“user-agent”标头。
 * 如果“user-agent”标头已存在，则后缀部分将附加到其上。
 * 如果不存在“user-agent”标头，则会使用后缀部分创建一个新标头。
 * 自动从标头中删除未定义的条目。
 *
 * @param headers - The original headers.
 * @param userAgentSuffixParts - The parts to append to the `user-agent` header.
 * @returns The new headers with the `user-agent` header set or updated.
 */
export function withUserAgentSuffix(
  headers: HeadersInit | Record<string, string | undefined> | undefined,
  ...userAgentSuffixParts: string[]
): Record<string, string> {
  const normalizedHeaders = new Headers(normalizeHeaders(headers));

  const currentUserAgentHeader = normalizedHeaders.get('user-agent') || '';

  normalizedHeaders.set(
    'user-agent',
    [currentUserAgentHeader, ...userAgentSuffixParts].filter(Boolean).join(' '),
  );

  return Object.fromEntries(normalizedHeaders.entries());
}
