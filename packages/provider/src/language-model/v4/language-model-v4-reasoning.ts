import type { SharedV4ProviderMetadata } from '../../shared';

/**
 * 推理模型已经生成。
 */
export type LanguageModelV4Reasoning = {
  type: 'reasoning';
  text: string;

  /**
   * 推理部分的可选提供者特定元数据。
   */
  providerMetadata?: SharedV4ProviderMetadata;
};
