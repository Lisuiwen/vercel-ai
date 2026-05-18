import type { SharedV3ProviderMetadata } from '../../shared/v3/shared-v3-provider-metadata';

/**
 * 提供者针对提供者执行的工具调用发出工具批准请求。
 *
 * 这用于提供商执行工具的流程（例如 MCP 工具）
 * 但在继续之前需要明确的用户批准。
 */
export type LanguageModelV3ToolApprovalRequest = {
  type: 'tool-approval-request';

  /**
   * 批准请求的 ID。这个ID会被后续的引用
   * tool-approval-response（工具消息）以批准或拒绝执行。
   */
  approvalId: string;

  /**
   * 此批准请求所针对的工具调用 ID。
   */
  toolCallId: string;

  /**
   * 用于批准请求的其他特定于提供商的元数据。
   */
  providerMetadata?: SharedV3ProviderMetadata;
};
