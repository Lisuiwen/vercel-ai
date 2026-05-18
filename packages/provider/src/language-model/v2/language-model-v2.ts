import type { SharedV2Headers } from '../../shared';
import type { SharedV2ProviderMetadata } from '../../shared/v2/shared-v2-provider-metadata';
import type { LanguageModelV2CallOptions } from './language-model-v2-call-options';
import type { LanguageModelV2CallWarning } from './language-model-v2-call-warning';
import type { LanguageModelV2Content } from './language-model-v2-content';
import type { LanguageModelV2FinishReason } from './language-model-v2-finish-reason';
import type { LanguageModelV2ResponseMetadata } from './language-model-v2-response-metadata';
import type { LanguageModelV2StreamPart } from './language-model-v2-stream-part';
import type { LanguageModelV2Usage } from './language-model-v2-usage';

/**
 * 实现语言模型接口版本 2 的语言模型规范。
 */
export type LanguageModelV2 = {
  /**
   * 语言模型必须指定它实现的语言模型接口版本。
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
   * 提供商按媒体类型支持的 URL 模式。
   *
   * 键是媒体类型模式或完整媒体类型（例如，“*\/*”表示所有内容、“audio/*”、“video/*”或“application/pdf”）。
   * 值是与 URL 路径匹配的正则表达式数组。
   *
   * 匹配应该针对小写 URL。
   *
   * 模型本身支持匹配的 URL，不会下载。
   *
   * @returns A map of supported URL patterns by media type (as a promise or a plain object).
   */
  supportedUrls:
    | PromiseLike<Record<string, RegExp[]>>
    | Record<string, RegExp[]>;

  /**
   * 生成语言模型输出（非流式）。
   *
   * 命名：“do”前缀，防止意外直接使用该方法
   * 由用户。
   */
  doGenerate(options: LanguageModelV2CallOptions): PromiseLike<{
    /**
     * 模型生成的有序内容。
     */
    content: Array<LanguageModelV2Content>;

    /**
     * 说完理由。
     */
    finishReason: LanguageModelV2FinishReason;

    /**
     * 使用信息。
     */
    usage: LanguageModelV2Usage;

    /**
     * 其他特定于提供商的元数据。他们通过
     * 从提供商到 AI SDK 并启用提供商特定的
     * 可以完全封装在提供者中的结果。
     */
    providerMetadata?: SharedV2ProviderMetadata;

    /**
     * 用于遥测和调试目的的可选请求信息。
     */
    request?: {
      /**
       * 请求发送到提供商 API 的 HTTP 正文。
       */
      body?: unknown;
    };

    /**
     * 用于遥测和调试目的的可选响应信息。
     */
    response?: LanguageModelV2ResponseMetadata & {
      /**
       * 响应标头。
       */
      headers?: SharedV2Headers;

      /**
       * 响应 HTTP 正文。
       */
      body?: unknown;
    };

    /**
     * 通话警告，例如不支持的设置。
     */
    warnings: Array<LanguageModelV2CallWarning>;
  }>;

  /**
   * 生成语言模型输出（流式传输）。
   *
   * 命名：“do”前缀，防止意外直接使用该方法
   * 由用户。
   *
   * @return A stream of higher-level language model output parts.
   */
  doStream(options: LanguageModelV2CallOptions): PromiseLike<{
    stream: ReadableStream<LanguageModelV2StreamPart>;

    /**
     * 用于遥测和调试目的的可选请求信息。
     */
    request?: {
      /**
       * 请求发送到提供商 API 的 HTTP 正文。
       */
      body?: unknown;
    };

    /**
     * 可选的响应数据。
     */
    response?: {
      /**
       * 响应标头。
       */
      headers?: SharedV2Headers;
    };
  }>;
};
