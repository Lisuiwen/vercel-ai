import { AISDKError } from '@ai-sdk/provider';

const name = 'AI_ToolCallNotFoundForApprovalError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class ToolCallNotFoundForApprovalError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly toolCallId: string;
  readonly approvalId: string;

  constructor({
    toolCallId,
    approvalId,
  }: {
    toolCallId: string;
    approvalId: string;
  }) {
    super({
      name,
      message: `Tool call "${toolCallId}" not found for approval request "${approvalId}".`,
    });

    this.toolCallId = toolCallId;
    this.approvalId = approvalId;
  }

  static isInstance(error: unknown): error is ToolCallNotFoundForApprovalError {
    return AISDKError.hasMarker(error, marker);
  }
}
