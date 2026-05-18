import type { SharedV3Headers, SharedV3Warning } from '../../shared';
import type { SharedV3ProviderMetadata } from '../../shared/v3/shared-v3-provider-metadata';
import type { LanguageModelV3Content } from './language-model-v3-content';
import type { LanguageModelV3FinishReason } from './language-model-v3-finish-reason';
import type { LanguageModelV3ResponseMetadata } from './language-model-v3-response-metadata';
import type { LanguageModelV3Usage } from './language-model-v3-usage';

/**
 * 语言模型 doGenerate 调用的结果。
 */
export type LanguageModelV3GenerateResult = {
  /**
   * 模型生成的有序内容。
   */
  content: Array<LanguageModelV3Content>;

  /**
   * 结束原因。
   */
  finishReason: LanguageModelV3FinishReason;

  /**
   * 使用信息。
   */
  usage: LanguageModelV3Usage;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从提供商到 AI SDK 并启用提供商特定的
   * 可以完全封装在提供者中的结果。
   */
  providerMetadata?: SharedV3ProviderMetadata;

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
  response?: LanguageModelV3ResponseMetadata & {
    /**
     * 响应标头。
     */
    headers?: SharedV3Headers;

    /**
     * 响应 HTTP 正文。
     */
    body?: unknown;
  };

  /**
   * 通话警告，例如不支持的设置。
   */
  warnings: Array<SharedV3Warning>;
};
