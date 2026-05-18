import type { FilePart, ImagePart, TextPart } from './content-part';
import type { ProviderOptions } from './provider-options';

/**
 * 一条用户消息。它可以包含文本或文本和图像的组合。
 */
export type UserModelMessage = {
  role: 'user';
  content: UserContent;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
};

/**
 * Content of a user message.它可以是字符串或文本和图像部分的数组。
 */
export type UserContent = string | Array<TextPart | ImagePart | FilePart>;
