import type {
  AssistantModelMessage,
  ToolModelMessage,
} from '@ai-sdk/provider-utils';

/**
 * 在生成过程中生成的消息。
 * 它可以是辅助消息，也可以是工具消息。
 */
export type ResponseMessage = AssistantModelMessage | ToolModelMessage;
