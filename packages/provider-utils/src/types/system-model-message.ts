import type { ProviderOptions } from './provider-options';

/**
 * 一条系统消息。它可以包含系统信息。
 *
 * 注意：强烈推荐使用提示的“系统”部分
 * 提高抵御即时注入攻击的能力，
 * 并且因为并非所有提供商都支持多种系统消息。
 */
export type SystemModelMessage = {
  role: 'system';
  content: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
};
