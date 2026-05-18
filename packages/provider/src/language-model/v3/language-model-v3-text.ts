import type { SharedV3ProviderMetadata } from '../../shared/v3/shared-v3-provider-metadata';

/**
 * 模型生成的文本。
 */
export type LanguageModelV3Text = {
  type: 'text';

  /**
   * 文字内容。
   */
  text: string;

  providerMetadata?: SharedV3ProviderMetadata;
};
