/**
 * 工具审批请求提示部分。
 */
export type ToolApprovalRequest = {
  type: 'tool-approval-request';

  /**
   * 工具批准的ID。
   */
  approvalId: string;

  /**
   * 批准请求所针对的工具调用的 ID。
   */
  toolCallId: string;

  /**
   * 指示该工具是自动批准还是拒绝的标志。
   *
   * @default false
   */
  isAutomatic?: boolean;
};
