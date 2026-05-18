import type {
  CustomPart,
  FilePart,
  ReasoningFilePart,
  ReasoningPart,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from './content-part';
import type { ProviderOptions } from './provider-options';
import type { ToolApprovalRequest } from './tool-approval-request';

/**
 * 助理消息。它可以包含文本、工具调用或文本和工具调用的组合。
 */
export type AssistantModelMessage = {
  role: 'assistant';
  content: AssistantContent;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
};

/**
 * 助理消息的内容。
 * 它可以是文本、图像、推理、编辑推理和工具调用部分的字符串或数组。
 */
export type AssistantContent =
  | string
  | Array<
      | TextPart
      | CustomPart
      | FilePart
      | ReasoningPart
      | ReasoningFilePart
      | ToolCallPart
      | ToolResultPart
      | ToolApprovalRequest
    >;
