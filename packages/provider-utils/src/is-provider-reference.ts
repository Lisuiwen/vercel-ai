import type { SharedV4ProviderReference } from '@ai-sdk/provider';
import { isBuffer } from './is-buffer';

/**
 * 检查某个值是否是提供者引用（提供者名称的映射
 * 特定于提供者的标识符）而不是原始字节、URL 或
 * 标记为“{ type: ... }”的对象。
 */
export function isProviderReference(
  data: unknown,
): data is SharedV4ProviderReference {
  return (
    typeof data === 'object' &&
    data !== null &&
    !(data instanceof Uint8Array) &&
    !(data instanceof URL) &&
    !(data instanceof ArrayBuffer) &&
    !isBuffer(data) &&
    !('type' in data)
  );
}
