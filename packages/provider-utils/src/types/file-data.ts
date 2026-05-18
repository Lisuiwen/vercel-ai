import type {
  SharedV4FileDataReference,
  SharedV4FileDataText,
  SharedV4FileDataUrl,
} from '@ai-sdk/provider';
import type { DataContent } from './data-content';

/**
 * 包含原始字节的文件数据变体（“Uint8Array”、“ArrayBuffer”或
 * `Buffer`) 或 Base64 编码的字符串。
 *
 * 这比“SharedV4FileDataData”稍微宽松一些。
 */
export interface FileDataData {
  type: 'data';
  data: DataContent;
}

/**
 * 包含指向该文件的 URL 的文件数据变体。
 */
export type FileDataUrl = SharedV4FileDataUrl;

/**
 * 包含提供程序引用的文件数据变体 (`{ [provider]: id }`)。
 */
export type FileDataReference = SharedV4FileDataReference;

/**
 * 包含内联文本内容的文件数据变体（例如内联文本
 * 文件）。
 */
export type FileDataText = SharedV4FileDataText;

/**
 * 将数据文件作为标记的可区分联合：
 *
 * - `{ type: 'data', data }`：原始字节（`Uint8Array`、`ArrayBuffer` 或
 *   `Buffer`) 或 Base64 编码的字符串。
 * - `{ type: 'url', url }`：指向文件的 URL。
 * - `{ type: 'reference', reference }`：提供者引用 (`{ [provider]: id }`)。
 * - `{ type: 'text', text }`：内联文本内容（例如内联文本文档）。
 */
export type FileData =
  | FileDataData
  | FileDataUrl
  | FileDataReference
  | FileDataText;
