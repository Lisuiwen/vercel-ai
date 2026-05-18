import type { SharedV4Headers, SharedV4Warning } from '../../shared';
import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';
import type { LanguageModelV4Content } from './language-model-v4-content';
import type { LanguageModelV4FinishReason } from './language-model-v4-finish-reason';
import type { LanguageModelV4ResponseMetadata } from './language-model-v4-response-metadata';
import type { LanguageModelV4Usage } from './language-model-v4-usage';

/**
 * 语言模型 doGenerate 调用的结果。
 */
export type LanguageModelV4GenerateResult = {
  /**
   * 模型生成的有序内容。
   */
  content: Array<LanguageModelV4Content>;

  /**
   * 结束原因。
   */
  finishReason: LanguageModelV4FinishReason;

  /**
   * 使用信息。
   */
  usage: LanguageModelV4Usage;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从提供商到 AI SDK 并启用提供商特定的
   * 可以完全封装在提供者中的结果。
   */
  providerMetadata?: SharedV4ProviderMetadata;

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
  response?: LanguageModelV4ResponseMetadata & {
    /**
     * 响应标头。
     */
    headers?: SharedV4Headers;

    /**
     * 响应 HTTP 正文。
     */
    body?: unknown;
  };

  /**
   * 通话警告，例如不支持的设置。
   */
  warnings: Array<SharedV4Warning>;
};
