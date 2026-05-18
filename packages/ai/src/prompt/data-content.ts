import {
  convertBase64ToUint8Array,
  convertUint8ArrayToBase64,
  type DataContent,
} from '@ai-sdk/provider-utils';
import { InvalidDataContentError } from './invalid-data-content-error';

/**
 * 将数据内容转换为Base64编码的字符串。
 *
 * @param content - 要转换的数据内容。
 * @returns Base64 编码的字符串。
 */
export function convertDataContentToBase64String(content: DataContent): string {
  if (typeof content === 'string') {
    return content;
  }

  if (content instanceof ArrayBuffer) {
    return convertUint8ArrayToBase64(new Uint8Array(content));
  }

  return convertUint8ArrayToBase64(content);
}

/**
 * 将数据内容转换为Uint8Array。
 *
 * @param content - 要转换的数据内容。
 * @returns Uint8Array。
 */
export function convertDataContentToUint8Array(
  content: DataContent,
): Uint8Array {
  if (content instanceof Uint8Array) {
    return content;
  }

  if (typeof content === 'string') {
    try {
      return convertBase64ToUint8Array(content);
    } catch (error) {
      throw new InvalidDataContentError({
        message:
          'Invalid data content. Content string is not a base64-encoded media.',
        content,
        cause: error,
      });
    }
  }

  if (content instanceof ArrayBuffer) {
    return new Uint8Array(content);
  }

  throw new InvalidDataContentError({ content });
}
