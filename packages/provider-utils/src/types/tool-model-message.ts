import type { ToolResultPart } from './content-part';
import type { ProviderOptions } from './provider-options';
import type { ToolApprovalResponse } from './tool-approval-response';

/**
 * 工具消息。它包含一个或多个工具调用的结果。
 */
export type ToolModelMessage = {
  role: 'tool';
  content: ToolContent;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
};

/**
 * 工具消息的内容。它是工具结果部分的数组。
 */
export type ToolContent = Array<ToolResultPart | ToolApprovalResponse>;
