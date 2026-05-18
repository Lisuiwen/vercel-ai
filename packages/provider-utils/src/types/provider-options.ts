import type { SharedV4ProviderOptions } from '@ai-sdk/provider';

/**
 * 其他特定于提供商的选项。
 *
 * 它们从 AI SDK 传递给提供商并启用
 * 可以完全封装在提供程序中的特定于提供程序的功能。
 */
export type ProviderOptions = SharedV4ProviderOptions;
