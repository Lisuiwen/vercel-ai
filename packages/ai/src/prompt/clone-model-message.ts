import type { ModelMessage } from '@ai-sdk/provider-utils';

/**
 * 克隆模型消息，同时保留 URL 实例。 Node 的结构化克隆
 * 目前拒绝 URL 对象，这些对象是有效的文件/图像提示负载。
 */
export function cloneModelMessages<T extends ModelMessage>(
  messages: Array<T>,
): Array<T> {
  return messages.map(message => cloneValue(message)) as Array<T>;
}

function cloneValue<T>(value: T): T {
  if (value instanceof URL) {
    return new URL(value.href) as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item)) as T;
  }

  if (value instanceof Uint8Array) {
    return new Uint8Array(value) as T;
  }

  if (value instanceof ArrayBuffer) {
    return value.slice(0) as T;
  }

  if (value instanceof Date) {
    return new Date(value) as T;
  }

  if (value != null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => [key, cloneValue(value)]),
    ) as T;
  }

  return value;
}
