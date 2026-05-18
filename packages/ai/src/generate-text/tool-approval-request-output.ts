import type { TypedToolCall } from './tool-call';
import type { ToolSet } from '@ai-sdk/provider-utils';

/**
 * 指示已发出工具批准请求的输出部分。
 *
 * 可以在下一条工具消息中批准或拒绝工具批准请求。
 */
export type ToolApprovalRequestOutput<TOOLS extends ToolSet> = {
  type: 'tool-approval-request';

  /**
   * 工具批准请求的 ID。
   */
  approvalId: string;

  /**
   * 批准请求所针对的工具调用。
   */
  toolCall: TypedToolCall<TOOLS>;

  /**
   * 指示该工具是自动批准还是拒绝的标志。
   *
   * @default false
   */
  isAutomatic?: boolean;
};
