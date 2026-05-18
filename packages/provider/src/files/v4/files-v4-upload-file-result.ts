import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';
import type { SharedV4ProviderReference } from '../../shared/v4/shared-v4-provider-reference';
import type { SharedV4Warning } from '../../shared/v4/shared-v4-warning';

/**
 * 通过文件接口上传文件的结果。
 */
export type FilesV4UploadFileResult = {
  /**
   * 将提供程序名称映射到提供程序特定的文件标识符的提供程序引用。
   */
  providerReference: SharedV4ProviderReference;

  /**
   * 上传文件的 IANA 媒体类型（如果提供商提供）。
   */
  mediaType?: string;

  /**
   * 上传文件的文件名（如果提供商提供）。
   */
  filename?: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerMetadata?: SharedV4ProviderMetadata;

  /**
   * 来自提供商的警告。
   */
  warnings: Array<SharedV4Warning>;
};
