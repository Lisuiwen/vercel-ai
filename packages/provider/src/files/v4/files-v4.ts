import type { FilesV4UploadFileCallOptions } from './files-v4-upload-file-call-options';
import type { FilesV4UploadFileResult } from './files-v4-upload-file-result';

/**
 * 实现文件接口版本 4 的文件管理接口规范。
 */
export type FilesV4 = {
  /**
   * 文件接口必须指定它实现的文件接口版本。
   */
  readonly specificationVersion: 'v4';

  /**
   * 提供商 ID。
   */
  readonly provider: string;

  /**
   * 将文件上传到提供商并返回提供商参考
   * 可以在后续的 API 调用中使用。
   */
  uploadFile(
    options: FilesV4UploadFileCallOptions,
  ): PromiseLike<FilesV4UploadFileResult>;
};
