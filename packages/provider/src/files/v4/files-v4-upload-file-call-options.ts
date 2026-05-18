import type {
  SharedV4FileDataData,
  SharedV4FileDataText,
} from '../../shared/v4/shared-v4-file-data';
import type { SharedV4ProviderOptions } from '../../shared/v4/shared-v4-provider-options';

/**
 * 通过文件界面上传文件的选项。
 */
export type FilesV4UploadFileCallOptions = {
  /**
   * 文件数据。
   *
   * - `{ type: 'data', data }`：原始字节 (`Uint8Array`) 或 Base64 编码的字符串。
   * - `{ type: 'text', text }`：内联文本 (UTF-8)。
   */
  data: SharedV4FileDataData | SharedV4FileDataText;

  /**
   * 文件的 IANA 媒体类型（例如“application/pdf”）。
   */
  mediaType: string;

  /**
   * 文件的文件名。
   */
  filename?: string;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV4ProviderOptions;
};
