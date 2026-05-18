import type { SharedV4ProviderOptions } from '../../shared';
import type { VideoModelV4File } from './video-model-v4-file';

export type VideoModelV4CallOptions = {
  /**
   * 视频生成的文本提示。
   */
  prompt: string | undefined;

  /**
   * 要生成的视频数量。默认值：1。
   * 由于计算成本，大多数视频模型仅支持 n=1。
   */
  n: number;

  /**
   * 要生成的视频的宽高比。
   * 必须采用“{width}:{height}”格式。
   * `undefined` 将使用提供者的默认宽高比。
   * 常用值：“16:9”、“9:16”、“1:1”、“21:9”、“4:3”
   */
  aspectRatio: `${number}:${number}` | undefined;

  /**
   * 要生成的视频的分辨率。
   * 格式：“{宽度}x{高度}”（例如“1280x720”、“1920x1080”）
   * `undefined` 将使用提供者的默认分辨率。
   */
  resolution: `${number}x${number}` | undefined;

  /**
   * 视频的持续时间（以秒为单位）。
   * `undefined` 将使用提供者的默认持续时间。
   * 大多数模型通常为 3-10 秒。
   */
  duration: number | undefined;

  /**
   * 视频的每秒帧数 (FPS)。
   * `undefined` 将使用提供商的默认 FPS。
   * 常用值：24、30、60
   */
  fps: number | undefined;

  /**
   * 确定性视频生成的种子。
   * `undefined` 将使用随机种子。
   */
  seed: number | undefined;

  /**
   * 用于生成图像到视频的输入图像。
   * 该图像用作模型动画的起始帧。
   */
  image: VideoModelV4File | undefined;

  /**
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   *
   * 示例：
   * {
   *   “错误”：{
   *     “循环”：正确，
   *     “运动强度”：0.8
   *   }
   * }
   */
  providerOptions: SharedV4ProviderOptions;

  /**
   * 用于取消操作的中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 与请求一起发送的附加 HTTP 标头。
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: Record<string, string | undefined>;
};
