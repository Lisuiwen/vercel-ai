import type { TypedToolCall } from './tool-call';
import type { ToolSet } from '@ai-sdk/provider-utils';

/**
 * 指示工具批准响应可用的输出部分。
 */
export type ToolApprovalResponseOutput<TOOLS extends ToolSet> = {
  type: 'tool-approval-response';

  /**
   * 工具批准的ID。
   */
  approvalId: string;

  /**
   * 批准响应所针对的工具调用。
   */
  toolCall: TypedToolCall<TOOLS>;

  /**
   * 指示批准是被授予还是被拒绝的标志。
   */
  approved: boolean;

  /**
   * 批准或拒绝的可选原因。
   */
  reason?: string;

  /**
   * 指示工具调用是否由提供者执行的标志。
   * 仅应将提供者执行的工具批准响应发送到模型。
   */
  providerExecuted?: boolean;
};
