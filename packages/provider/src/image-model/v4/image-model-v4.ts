import type { ImageModelV4CallOptions } from './image-model-v4-call-options';
import type { ImageModelV4Result } from './image-model-v4-result';

type GetMaxImagesPerCallFunction = (options: {
  modelId: string;
}) => PromiseLike<number | undefined> | number | undefined;

/**
 * 图像生成模型规范第 3 版。
 */
export type ImageModelV4 = {
  /**
   * 图像模型必须指定哪个图像模型接口
   * 它实现的版本。这将使我们能够发展图像
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
   * 一次 API 调用中可以生成多少图像的限制。
   * 可以设置为一个数字进行固定限制，以undefined来使用
   * 全局限制，或返回数字或未定义的函数，
   * 可选地作为承诺。
   */
  readonly maxImagesPerCall: number | undefined | GetMaxImagesPerCallFunction;

  /**
   * 生成图像数组。
   */
  doGenerate(options: ImageModelV4CallOptions): PromiseLike<ImageModelV4Result>;
};
