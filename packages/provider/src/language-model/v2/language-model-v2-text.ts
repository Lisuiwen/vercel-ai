import type { SharedV2ProviderMetadata } from '../../shared/v2/shared-v2-provider-metadata';

/**
 * 模型生成的文本。
 */
export type LanguageModelV2Text = {
  type: 'text';

  /**
   * 文字内容。
   */
  text: string;

  providerMetadata?: SharedV2ProviderMetadata;
};
