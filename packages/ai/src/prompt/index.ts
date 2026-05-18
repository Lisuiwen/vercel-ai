import type { LanguageModelCallOptions } from './language-model-call-options';
import type { RequestOptions } from './request-options';

export type { LanguageModelCallOptions } from './language-model-call-options';
export type { RequestOptions, TimeoutConfiguration } from './request-options';

/* * @deprecated 使用 `LanguageModelCallOptions` 与 `RequestOptions` 结合使用。 */
export type CallSettings = LanguageModelCallOptions &
  Omit<RequestOptions, 'timeout'>;
export {
  getTotalTimeoutMs,
  getStepTimeoutMs,
  getChunkTimeoutMs,
  getToolTimeoutMs,
} from './request-options';
export {
  assistantModelMessageSchema,
  modelMessageSchema,
  systemModelMessageSchema,
  toolModelMessageSchema,
  userModelMessageSchema,
} from './message';
export type { Instructions, Prompt } from './prompt';
export { convertDataContentToBase64String } from './data-content';

// 从provider-utils重新导出类型
export type {
  AssistantContent,
  AssistantModelMessage,
  DataContent,
  FilePart,
  ImagePart,
  ModelMessage,
  SystemModelMessage,
  TextPart,
  ToolCallPart,
  ToolContent,
  ToolModelMessage,
  ToolResultPart,
  UserContent,
  UserModelMessage,
} from '@ai-sdk/provider-utils';
