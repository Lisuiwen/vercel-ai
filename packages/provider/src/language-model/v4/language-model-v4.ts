import type { LanguageModelV4CallOptions } from './language-model-v4-call-options';
import type { LanguageModelV4GenerateResult } from './language-model-v4-generate-result';
import type { LanguageModelV4StreamResult } from './language-model-v4-stream-result';

/**
 * 实现语言模型接口版本 4 的语言模型规范。
 */
export type LanguageModelV4 = {
  /**
   * 语言模型必须指定它实现的语言模型接口版本。
   */
  readonly specificationVersion: 'v4';

  /**
   * 提供商 ID。
   */
  readonly provider: string;

  /**
   * 提供商特定的模型 ID。
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
  doGenerate(
    options: LanguageModelV4CallOptions,
  ): PromiseLike<LanguageModelV4GenerateResult>;

  /**
   * 生成语言模型输出（流式传输）。
   *
   * 命名：“do”前缀，防止意外直接使用该方法
   * 由用户。
   *
   * @return A stream of higher-level language model output parts.
   */
  doStream(
    options: LanguageModelV4CallOptions,
  ): PromiseLike<LanguageModelV4StreamResult>;
};
