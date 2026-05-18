/**
 * 从响应对象中提取标头并将其作为键值对象返回。
 *
 * @param response - The response object to extract headers from.
 * @returns The headers as a key-value object.
 */
export function extractResponseHeaders(response: Response) {
  return Object.fromEntries<string>([...response.headers]);
}
