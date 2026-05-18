import type { ImageModelV4File } from '@ai-sdk/provider';
import { convertUint8ArrayToBase64 } from './uint8-utils';

/**
 * 将 ImageModelV4File 转换为 URL 或数据 URI 字符串。
 *
 * 如果文件是 URL，则按原样返回 URL。
 * 如果文件是 Base64 数据，则返回包含 Base64 数据的数据 URI。
 * 如果文件是 Uint8Array，它将其转换为 base64 并返回数据 URI。
 */
export function convertImageModelFileToDataUri(file: ImageModelV4File): string {
  if (file.type === 'url') return file.url;

  return `data:${file.mediaType};base64,${
    typeof file.data === 'string'
      ? file.data
      : convertUint8ArrayToBase64(file.data)
  }`;
}
