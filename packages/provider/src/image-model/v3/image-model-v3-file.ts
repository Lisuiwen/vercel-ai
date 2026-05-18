import type { SharedV3ProviderMetadata } from '../../shared';

/**
 * 可用于图像编辑或变体生成的图像文件。
 */
export type ImageModelV3File =
  | {
      type: 'file';

      /**
       * 文件的 IANA 媒体类型，例如`图像/png`。支持任何字符串。
       *
       * @see https://www.iana.org/assignments/media-types/media-types.xhtml
       */
      mediaType: string;

      /**
       * 生成的文件数据为 base64 编码字符串或二进制数据。
       *
       * 应返回文件数据，而不进行任何不必要的转换。
       * 如果API返回base64编码的字符串，则应返回文件数据
       * 作为 base64 编码的字符串。如果API返回二进制数据，则文件数据应该
       * 以二进制数据形式返回。
       */
      data: string | Uint8Array;

      /**
       * 文件部分的可选提供者特定元数据。
       */
      providerOptions?: SharedV3ProviderMetadata;
    }
  | {
      type: 'url';

      /**
       * 图像文件的 URL。
       */
      url: string;

      /**
       * 文件部分的可选提供者特定元数据。
       */
      providerOptions?: SharedV3ProviderMetadata;
    };
