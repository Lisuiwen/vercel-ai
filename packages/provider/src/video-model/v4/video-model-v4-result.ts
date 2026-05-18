import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';
import type { SharedV4Warning } from '../../shared/v4/shared-v4-warning';

/**
 * 生成的视频数据。可以是 URL、base64 编码的字符串或二进制数据。
 */
export type VideoModelV4VideoData =
  | {
      /**
       * 视频以 URL 形式提供（对于视频提供商来说最常见）。
       */
      type: 'url';
      url: string;
      mediaType: string;
    }
  | {
      /**
       * Video as base64-encoded string.
       */
      type: 'base64';
      data: string;
      mediaType: string;
    }
  | {
      /**
       * 作为二进制数据的视频。
       */
      type: 'binary';
      data: Uint8Array;
      mediaType: string;
    };

/**
 * 视频模型 doGenerate 调用的结果。
 */
export type VideoModelV4Result = {
  /**
   * 以 URL、base64 字符串或二进制数据形式生成视频。
   *
   * 由于文件较大，大多数提供商都会返回视频文件（MP4、WebM）的 URL。
   * 使用可判别联合来指示返回的视频数据的类型。
   */
  videos: Array<VideoModelV4VideoData>;

  /**
   * 通话警告，例如不支持的功能。
   */
  warnings: Array<SharedV4Warning>;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从提供商到 AI SDK 并启用提供商特定的
   * 可以完全封装在提供者中的结果。
   *
   * 外部记录以提供者名称为键，内部记录以提供者名称为键
   * 记录是特定于提供者的元数据。
   *
   * ````ts
   * {
   *   “错误”：{
   *     “视频”：[{
   *       “持续时间”：5.0，
   *       “每秒帧数”：24，
   *       “宽度”：1280，
   *       “高度”：720
   *     }]
   *   }
   * }
   * ```
   */
  providerMetadata?: SharedV4ProviderMetadata;

  /**
   * 用于遥测和调试目的的响应信息。
   */
  response: {
    /**
     * 生成的响应的开始时间戳。
     */
    timestamp: Date;

    /**
     * 用于生成响应的响应模型的 ID。
     */
    modelId: string;

    /**
     * 响应标头。
     */
    headers: Record<string, string> | undefined;
  };
};
