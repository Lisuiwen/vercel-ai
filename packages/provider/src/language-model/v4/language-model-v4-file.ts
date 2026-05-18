import type {
  SharedV4FileDataData,
  SharedV4FileDataUrl,
  SharedV4ProviderMetadata,
} from '../../shared';

/**
 * 模型生成的文件。
 * 生成的文件为 base64 编码字符串或二进制数据。
 * 文件应返回且不进行任何不必要的转换。
 */
export type LanguageModelV4File = {
  type: 'file';

  /**
   * 文件的 IANA 媒体类型，例如`图像/png`或`音频/mp3`。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType: string;

  /**
   * 生成的文件数据作为标记的可区分联合：
   *
   * - `{ type: 'data', data }`：原始字节 (Uint8Array) 或 base64 编码的字符串。
   * - `{ type: 'url', url }`：指向文件的 URL。
   *
   * 应返回文件数据，而不进行任何不必要的转换。
   * 如果API返回base64编码的字符串，则应返回文件数据
   * 作为 base64 编码的字符串。如果API返回二进制数据，则文件数据应该
   * 以二进制数据形式返回。
   */
  data: SharedV4FileDataData | SharedV4FileDataUrl;

  /**
   * 文件部分的可选提供者特定元数据。
   */
  providerMetadata?: SharedV4ProviderMetadata;
};
