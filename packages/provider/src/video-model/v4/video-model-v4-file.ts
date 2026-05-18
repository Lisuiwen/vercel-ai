import type { SharedV4ProviderMetadata } from '../../shared';

/**
 * 可用于视频编辑或图像到视频生成的视频或图像文件。
 * 支持图像输入（用于图像到视频）和视频输入（用于编辑）。
 */
export type VideoModelV4File =
  | {
      type: 'file';

      /**
       * 文件的 IANA 媒体类型。
       * 视频类型：“视频/mp4”、“视频/webm”、“视频/quicktime”
       * 图像类型：'image/png'、'image/jpeg'、'image/webp'
       */
      mediaType: string;

      /**
       * 文件数据为 base64 编码字符串或二进制数据。
       */
      data: string | Uint8Array;

      /**
       * 文件部分的可选提供者特定元数据。
       */
      providerOptions?: SharedV4ProviderMetadata;
    }
  | {
      type: 'url';

      /**
       * 视频或图像文件的 URL。
       */
      url: string;

      /**
       * 文件部分的可选提供者特定元数据。
       */
      providerOptions?: SharedV4ProviderMetadata;
    };
