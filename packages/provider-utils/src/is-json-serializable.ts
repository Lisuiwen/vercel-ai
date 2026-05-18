import type { JSONValue } from '@ai-sdk/provider';

/**
 * 检查值是否可以跨越工作流序列化边界。
 *
 * 该检查接受类似 JSON 的原语、数组和普通对象，其
 * 嵌套值也是可序列化的。它拒绝函数、符号、
 * bigint 和非普通对象，例如类实例、日期和正则表达式。
 */
export function isJSONSerializable(value: unknown): value is JSONValue {
  if (value === null || value === undefined) return true;

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  if (type === 'function' || type === 'symbol' || type === 'bigint')
    return false;

  if (Array.isArray(value)) {
    return value.every(isJSONSerializable);
  }

  if (Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value as Record<string, unknown>).every(
      isJSONSerializable,
    );
  }

  return false;
}
