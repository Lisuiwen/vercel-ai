import type { SharedV4ProviderReference } from './shared-v4-provider-reference';

/**
 * 包含原始字节（“Uint8Array”）或 Base64 编码的文件数据变体
 * 字符串。
 */
export interface SharedV4FileDataData {
  type: 'data';
  data: Uint8Array | string;
}

/**
 * 包含指向该文件的 URL 的文件数据变体。
 */
export interface SharedV4FileDataUrl {
  type: 'url';
  url: URL;
}

/**
 * 包含提供程序引用的文件数据变体 (`{ [provider]: id }`)。
 */
export interface SharedV4FileDataReference {
  type: 'reference';
  reference: SharedV4ProviderReference;
}

/**
 * 包含内联文本内容的文件数据变体（例如内联文本
 * 文件）。
 */
export interface SharedV4FileDataText {
  type: 'text';
  text: string;
}

/**
 * 将数据文件作为标记的可区分联合：
 *
 * - `{ type: 'data', data }`：原始字节 (`Uint8Array`) 或 base64 编码的字符串。
 * - `{ type: 'url', url }`：指向文件的 URL。
 * - `{ type: 'reference', reference }`：提供者引用 (`{ [provider]: id }`)。
 * - `{ type: 'text', text }`：内联文本内容（例如内联文本文档）。
 */
export type SharedV4FileData =
  | SharedV4FileDataData
  | SharedV4FileDataUrl
  | SharedV4FileDataReference
  | SharedV4FileDataText;
