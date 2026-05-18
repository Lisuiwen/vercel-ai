/**
 * Node.js `Buffer` 实例的类型保护。
 *
 * 在 `globalThis.Buffer` 上使用可选链接，因此它返回 `false`
 * `Buffer` 不可用的运行时（例如 CloudFlare Workers）。
 */
export function isBuffer(value: unknown): value is Buffer {
  return globalThis.Buffer?.isBuffer(value) ?? false;
}
