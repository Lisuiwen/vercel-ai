import type { JSONValue } from '../../json-value';
import type { SharedV2Headers } from '../../shared';
import type { TranscriptionModelV2CallOptions } from './transcription-model-v2-call-options';
import type { TranscriptionModelV2CallWarning } from './transcription-model-v2-call-warning';

/**
 * 转录模型规范版本 2。
 */
export type TranscriptionModelV2 = {
  /**
   * 转录模型必须指定哪个转录模型接口
   * 它实现的版本。这将使我们能够进化转录
   * 模型接口并保留向后兼容性。不同的
   * 实现版本可以作为有区别的联合来处理
   * 在我们这边。
   */
  readonly specificationVersion: 'v2';

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
  doGenerate(options: TranscriptionModelV2CallOptions): PromiseLike<{
    /**
     * 音频的完整转录文本。
     */
    text: string;

    /**
     * 带有时间信息的转录片段数组。
     * 每个片段代表转录文本的一部分以及开始和结束时间。
     */
    segments: Array<{
      /**
       * 该段的文本内容。
       */
      text: string;
      /**
       * 该段的开始时间（以秒为单位）。
       */
      startSecond: number;
      /**
       * 该段的结束时间（以秒为单位）。
       */
      endSecond: number;
    }>;

    /**
     * 检测到的音频内容的语言，作为 ISO-639-1 代码（例如，“en”表示英语）。
     * 如果无法检测到语言，则可能是未定义的。
     */
    language: string | undefined;

    /**
     * 音频文件的总持续时间（以秒为单位）。
     * 如果无法确定持续时间，则可能是未定义的。
     */
    durationInSeconds: number | undefined;

    /**
     * 通话警告，例如不支持的设置。
     */
    warnings: Array<TranscriptionModelV2CallWarning>;

    /**
     * 用于遥测和调试目的的可选请求信息。
     */
    request?: {
      /**
       * 以字符串形式发送到提供商 API 的原始请求 HTTP 正文（JSON 应进行字符串化）。
       * 非 HTTP(s) 提供商不应设置此项。
       */
      body?: string;
    };

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
      headers?: SharedV2Headers;

      /**
       * 响应体。
       */
      body?: unknown;
    };

    /**
     * 其他特定于提供商的元数据。他们通过
     * 从提供商到 AI SDK 并启用提供商特定的
     * 可以完全封装在提供者中的结果。
     */
    providerMetadata?: Record<string, Record<string, JSONValue>>;
  }>;
};
