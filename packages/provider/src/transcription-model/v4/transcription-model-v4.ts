import type { TranscriptionModelV4CallOptions } from './transcription-model-v4-call-options';
import type { TranscriptionModelV4Result } from './transcription-model-v4-result';

/**
 * 转录模型规范版本 3。
 */
export type TranscriptionModelV4 = {
  /**
   * 转录模型必须指定哪个转录模型接口
   * 它实现的版本。这将使我们能够进化转录
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
   * 生成成绩单。
   */
  doGenerate(
    options: TranscriptionModelV4CallOptions,
  ): PromiseLike<TranscriptionModelV4Result>;
};
