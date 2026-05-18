import type { SpeechModelV4CallOptions } from './speech-model-v4-call-options';
import type { SpeechModelV4Result } from './speech-model-v4-result';

/**
 * 语音模型规范第 3 版。
 */
export type SpeechModelV4 = {
  /**
   * 语音模型必须指定哪个语音模型接口
   * 它实现的版本。这将使我们能够改进演讲
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
   * 从文本生成语音音频。
   */
  doGenerate(
    options: SpeechModelV4CallOptions,
  ): PromiseLike<SpeechModelV4Result>;
};
