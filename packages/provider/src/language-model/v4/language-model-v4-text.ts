import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';

/**
 * 模型生成的文本。
 */
export type LanguageModelV4Text = {
  type: 'text';

  /**
   * 文字内容。
   */
  text: string;

  providerMetadata?: SharedV4ProviderMetadata;
};
