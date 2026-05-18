import type { VideoModelV3CallOptions } from './video-model-v3-call-options';
import type { SharedV3ProviderMetadata } from '../../shared/v3/shared-v3-provider-metadata';
import type { SharedV3Warning } from '../../shared/v3/shared-v3-warning';

type GetMaxVideosPerCallFunction = (options: {
  modelId: string;
}) => PromiseLike<number | undefined> | number | undefined;

/**
 * 生成的视频数据。可以是 URL、base64 编码的字符串或二进制数据。
 */
export type VideoModelV3VideoData =
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
 * 视频生成模型规范版本 3。
 */
export type VideoModelV3 = {
  /**
   * 视频模型必须指定哪个视频模型接口
   * 它实现的版本。这将使我们能够改进视频
   * 模型接口并保留向后兼容性。不同的
   * 实现版本可以作为有区别的联合来处理
   * 在我们这边。
   */
  readonly specificationVersion: 'v3';

  /**
   * 用于记录目的的提供商名称。
   */
  readonly provider: string;

  /**
   * Provider-specific model ID for logging purposes.
   */
  readonly modelId: string;

  /**
   * 一次 API 调用可以生成多少视频的限制。
   * 可以设置为一个数字进行固定限制，以undefined来使用
   * 全局限制，或返回数字或未定义的函数，
   * 可选地作为承诺。
   *
   * 大多数视频模型一次仅支持生成 1 个视频，因为
   * 计算成本。默认值通常为 1。
   */
  readonly maxVideosPerCall: number | undefined | GetMaxVideosPerCallFunction;

  /**
   * 生成视频数组。
   */
  doGenerate(options: VideoModelV3CallOptions): PromiseLike<{
    /**
     * 以 URL、base64 字符串或二进制数据形式生成视频。
     *
     * 由于文件较大，大多数提供商都会返回视频文件（MP4、WebM）的 URL。
     * 使用可判别联合来指示返回的视频数据的类型。
     */
    videos: Array<VideoModelV3VideoData>;

    /**
     * 通话警告，例如不支持的功能。
     */
    warnings: Array<SharedV3Warning>;

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
    providerMetadata?: SharedV3ProviderMetadata;

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
  }>;
};
