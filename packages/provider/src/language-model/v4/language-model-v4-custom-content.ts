import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';

/**
 * 特定于提供者的内容块，不映射到另一个标准化的内容块
 * 内容部分类型。
 */
export type LanguageModelV4CustomContent = {
  type: 'custom';

  /**
   * 自定义内容的类型，格式为“{provider}.{provider-type}”。
   */
  kind: `${string}.${string}`;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerMetadata?: SharedV4ProviderMetadata;
};
