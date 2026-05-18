import type { JSONObject } from '../../json-value';
import type { SharedV2Headers } from '../../shared';
import type { SharedV3Warning } from '../../shared/v3/shared-v3-warning';
import type { SpeechModelV3CallOptions } from './speech-model-v3-call-options';

/**
 * 语音模型规范第 3 版。
 */
export type SpeechModelV3 = {
  /**
   * 语音模型必须指定哪个语音模型接口
   * 它实现的版本。这将使我们能够改进演讲
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
   * 从文本生成语音音频。
   */
  doGenerate(options: SpeechModelV3CallOptions): PromiseLike<{
    /**
     * 生成音频作为 ArrayBuffer。
     * 返回音频时应不进行任何不必要的转换。
     * 如果API返回base64编码的字符串，则应返回音频
     * 作为 base64 编码的字符串。如果 API 返回二进制数据，则音频
     * 应作为二进制数据返回。
     */
    audio: string | Uint8Array;

    /**
     * 通话警告，例如不支持的设置。
     */
    warnings: Array<SharedV3Warning>;

    /**
     * 用于遥测和调试目的的可选请求信息。
     */
    request?: {
      /**
       * 响应正文（仅适用于使用 HTTP 请求的提供商）。
       */
      body?: unknown;
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
    providerMetadata?: Record<string, JSONObject>;
  }>;
};
