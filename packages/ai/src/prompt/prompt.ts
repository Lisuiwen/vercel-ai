import type { ModelMessage, SystemModelMessage } from '@ai-sdk/provider-utils';

/**
 * 要包含在提示中的说明。可以与“提示”或“消息”一起使用。
 */
export type Instructions =
  | string
  | SystemModelMessage
  | Array<SystemModelMessage>;

/**
 * 提示部分AI功能选项。
 * 它包含说明、简单的文本提示或消息列表。
 */
export type Prompt = {
  /**
   * 要包含在提示中的说明。可以与“提示”或“消息”一起使用。
   */
  instructions?: Instructions;

  /**
   * 要包含在提示中的说明。可以与“提示”或“消息”一起使用。
   *
   * @deprecated 请改用`说明`。
   */
  system?: Instructions;

  /**
   * “提示”或“消息”字段中是否允许系统消息。
   *
   * 禁用时，必须通过“说明”提供系统消息
   * 选项。
   *
   * @default false
   */
  allowSystemInMessages?: boolean;
} & (
  | {
      /**
       * 一个提示。它可以是文本提示或消息列表。
       *
       * 您可以使用“提示”或“消息”，但不能同时使用两者。
       */
      prompt: string | Array<ModelMessage>;

      /**
       * 消息列表。
       *
       * 您可以使用“提示”或“消息”，但不能同时使用两者。
       */
      messages?: never;
    }
  | {
      /**
       * 消息列表。
       *
       * 您可以使用“提示”或“消息”，但不能同时使用两者。
       */
      messages: Array<ModelMessage>;

      /**
       * 一个提示。它可以是文本提示或消息列表。
       *
       * 您可以使用“提示”或“消息”，但不能同时使用两者。
       */
      prompt?: never;
    }
);
