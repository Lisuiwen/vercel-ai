import type { AssistantModelMessage } from './assistant-model-message';
import type { SystemModelMessage } from './system-model-message';
import type { ToolModelMessage } from './tool-model-message';
import type { UserModelMessage } from './user-model-message';

/**
 * 可以在提示的“messages”字段中使用的消息。
 * 它可以是用户消息、助手消息或工具消息。
 */
export type ModelMessage =
  | SystemModelMessage
  | UserModelMessage
  | AssistantModelMessage
  | ToolModelMessage;
