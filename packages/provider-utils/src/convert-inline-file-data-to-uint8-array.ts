import type { FilePart } from './types/content-part';
import { convertBase64ToUint8Array } from './uint8-utils';

type InlineFileData = Extract<
  FilePart['data'],
  { type: 'data' } | { type: 'text' }
>;

/**
 * 将内联文件数据（标记的“数据”或“文本”形状）转换为原始字节。
 *
 * - `{ type: 'text', text }` → UTF-8 编码字节
 * - `{ 类型：'数据'，数据：Uint8Array |缓冲区 }` → 按原样返回
 * - `{ type: 'data', data: ArrayBuffer }` → 包装在 `Uint8Array` 中
 * - `{ type: 'data', data: string }` → 解码为 base64
 */
export function convertInlineFileDataToUint8Array(
  data: InlineFileData,
): Uint8Array {
  if (data.type === 'text') {
    return new TextEncoder().encode(data.text);
  }
  if (data.data instanceof Uint8Array) {
    return data.data;
  }
  if (data.data instanceof ArrayBuffer) {
    return new Uint8Array(data.data);
  }
  return convertBase64ToUint8Array(data.data);
}
