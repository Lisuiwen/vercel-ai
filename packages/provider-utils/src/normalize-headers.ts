/**
 * 使用小写键将不同的标头输入规范化为普通记录。
 * 具有“未定义”或“空”值的条目将被删除。
 *
 * @param headers - Input headers (`Headers`, tuples array, plain record) to normalize.
 * @returns A record containing the normalized header entries.
 */
export function normalizeHeaders(
  headers:
    | HeadersInit
    | Record<string, string | undefined>
    | Array<[string, string | undefined]>
    | undefined,
): Record<string, string> {
  if (headers == null) {
    return {};
  }

  const normalized: Record<string, string> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key.toLowerCase()] = value;
    });
  } else {
    if (!Array.isArray(headers)) {
      headers = Object.entries(headers);
    }

    for (const [key, value] of headers) {
      if (value != null) {
        normalized[key.toLowerCase()] = value;
      }
    }
  }

  return normalized;
}
