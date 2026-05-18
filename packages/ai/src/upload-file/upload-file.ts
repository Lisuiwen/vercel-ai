import type {
  FilesV4,
  FilesV4UploadFileCallOptions,
  ProviderV4,
} from '@ai-sdk/provider';
import {
  convertBase64ToUint8Array,
  detectMediaType,
} from '@ai-sdk/provider-utils';
import type { ProviderMetadata } from '../types/provider-metadata';
import type { ProviderReference } from '../types/provider-reference';
import type { Warning } from '../types/warning';
import type { UploadFileResult } from './upload-file-result';

/**
 * 使用文件 API 接口上传文件。
 *
 * @param api - 用于上传的文件 API 接口。
 * @param data - 要上传的文件数据（标记为`{ type: 'data' | 'text' }`）。
 * @param mediaType - 可选的 IANA 媒体类型。从文件字节自动检测
 * 快捷时（对于`text`变体，回退到`text/plain`）。
 * @param filename - 上传文件的可选文件名。
 * @param providerOptions - 其他特定于提供商的选项。
 *
 * @returns 包含提供者引用和可选元数据的结果对象。
 */
export async function uploadFile({
  api,
  data: dataArg,
  mediaType: mediaTypeArg,
  filename,
  providerOptions,
}: {
  /**
   * 用于上传的文件API接口。
   * 可以是`FilesV4`实例或具有`files()`方法的`ProviderV4`实例。
   */
  api: FilesV4 | ProviderV4;
} & Omit<FilesV4UploadFileCallOptions, 'mediaType' | 'data'> & {
    /**
     * 数据。接受标记为“{ type: 'data' | 'text' }` 形状，或者
     * 简写`Uint8Array | string`（被视为“{ type: 'data', data }`）。
     */
    data: FilesV4UploadFileCallOptions['data'] | Uint8Array | string;

    /**
     * 文件的任选 IANA 媒体类型。当以下情况时自动从文件字节中检测
     * 简单；对于`text`变体，回退到`text/plain`。
     */
    mediaType?: string;
  }): Promise<UploadFileResult> {
  const data: FilesV4UploadFileCallOptions['data'] =
    dataArg instanceof Uint8Array || typeof dataArg === 'string'
      ? { type: 'data', data: dataArg }
      : dataArg;

  const mediaType =
    mediaTypeArg ??
    (data.type === 'text'
      ? 'text/plain'
      : (detectMediaType({ data: data.data }) ??
        (isLikelyText(data.data) ? 'text/plain' : 'application/octet-stream')));

  const filesApi: FilesV4 =
    'uploadFile' in api
      ? api
      : typeof api.files === 'function'
        ? api.files()
        : (() => {
            throw new Error(
              'The provider does not support file uploads. Make sure it exposes a files() method.',
            );
          })();

  const result = await filesApi.uploadFile({
    data,
    mediaType,
    filename,
    providerOptions,
  });

  return new DefaultUploadFileResult({
    providerReference: result.providerReference,
    mediaType: result.mediaType,
    filename: result.filename,
    providerMetadata: result.providerMetadata,
    warnings: result.warnings,
  });
}

class DefaultUploadFileResult implements UploadFileResult {
  readonly providerReference: ProviderReference;
  readonly mediaType?: string;
  readonly filename?: string;
  readonly providerMetadata?: ProviderMetadata;
  readonly warnings: Array<Warning>;

  constructor(options: {
    providerReference: ProviderReference;
    mediaType?: string;
    filename?: string;
    providerMetadata?: ProviderMetadata;
    warnings: Array<Warning>;
  }) {
    this.providerReference = options.providerReference;
    this.mediaType = options.mediaType;
    this.filename = options.filename;
    this.providerMetadata = options.providerMetadata;
    this.warnings = options.warnings;
  }
}

function isLikelyText(data: Uint8Array | string): boolean {
  /*
   * 为了提高性能，将检查限制为 512 字节。
   * 4个base64字符代表3个字节，为了安全起见，我们使用了4个字节的小余量。
   */
  const CHECK_LENGTH = 512;
  const BASE64_CHECK_LENGTH = Math.ceil((CHECK_LENGTH + 4) / 3) * 4;

  const bytes =
    typeof data === 'string'
      ? convertBase64ToUint8Array(
          data.substring(0, Math.min(data.length, BASE64_CHECK_LENGTH)),
        )
      : data;

  const checkLength = Math.min(bytes.length, CHECK_LENGTH);
  if (checkLength === 0) return false;

  for (let i = 0; i < checkLength; i++) {
    const byte = bytes[i];
    if (
      byte === 0x00 ||
      (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d)
    ) {
      return false;
    }
  }
  return true;
}
