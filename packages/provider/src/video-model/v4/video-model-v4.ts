import type { VideoModelV4CallOptions } from './video-model-v4-call-options';
import type { VideoModelV4Result } from './video-model-v4-result';

type GetMaxVideosPerCallFunction = (options: {
  modelId: string;
}) => PromiseLike<number | undefined> | number | undefined;

/**
 * 视频生成模型规范版本 3。
 */
export type VideoModelV4 = {
  /**
   * 视频模型必须指定哪个视频模型接口
   * 它实现的版本。这将使我们能够改进视频
   * 模型接口并保留向后兼容性。不同的
   * 实现版本可以作为有区别的联合来处理
   * 在我们这边。
   */
  readonly specificationVersion: 'v4';

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
  doGenerate(options: VideoModelV4CallOptions): PromiseLike<VideoModelV4Result>;
};
