import type {
  ModelMessage,
  ToolApprovalRequest,
  ToolApprovalResponse,
  ToolSet,
} from '@ai-sdk/provider-utils';
import { InvalidToolApprovalError } from '../error/invalid-tool-approval-error';
import { ToolCallNotFoundForApprovalError } from '../error/tool-call-not-found-for-approval-error';
import type { TypedToolCall } from './tool-call';
import type { TypedToolResult } from './tool-result';

export type CollectedToolApprovals<TOOLS extends ToolSet> = {
  approvalRequest: ToolApprovalRequest;
  approvalResponse: ToolApprovalResponse;
  toolCall: TypedToolCall<TOOLS>;
};

/**
 * 如果最后一条消息是工具消息，则此功能收集所有工具批准
 * 从那条消息。
 */
export function collectToolApprovals<TOOLS extends ToolSet>({
  messages,
}: {
  messages: ModelMessage[];
}): {
  approvedToolApprovals: Array<CollectedToolApprovals<TOOLS>>;
  deniedToolApprovals: Array<CollectedToolApprovals<TOOLS>>;
} {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role != 'tool') {
    return {
      approvedToolApprovals: [],
      deniedToolApprovals: [],
    };
  }

  // 收集工具调用并准备查找
  const toolCallsByToolCallId: Record<string, TypedToolCall<TOOLS>> = {};
  for (const message of messages) {
    if (message.role === 'assistant' && typeof message.content !== 'string') {
      const content = message.content;
      for (const part of content) {
        if (part.type === 'tool-call') {
          toolCallsByToolCallId[part.toolCallId] = part as TypedToolCall<TOOLS>;
        }
      }
    }
  }

  // 收集批准回复并准备查找
  const toolApprovalRequestsByApprovalId: Record<string, ToolApprovalRequest> =
    {};
  for (const message of messages) {
    if (message.role === 'assistant' && typeof message.content !== 'string') {
      const content = message.content;
      for (const part of content) {
        if (part.type === 'tool-approval-request') {
          toolApprovalRequestsByApprovalId[part.approvalId] = part;
        }
      }
    }
  }

  // 从最后一个工具消息中收集工具结果
  const toolResults: Record<string, TypedToolResult<TOOLS>> = {};
  for (const part of lastMessage.content) {
    if (part.type === 'tool-result') {
      toolResults[part.toolCallId] = part as TypedToolResult<TOOLS>;
    }
  }

  const approvedToolApprovals: Array<CollectedToolApprovals<TOOLS>> = [];
  const deniedToolApprovals: Array<CollectedToolApprovals<TOOLS>> = [];

  const approvalResponses = lastMessage.content.filter(
    part => part.type === 'tool-approval-response',
  );
  for (const approvalResponse of approvalResponses) {
    const approvalRequest =
      toolApprovalRequestsByApprovalId[approvalResponse.approvalId];

    if (approvalRequest == null) {
      throw new InvalidToolApprovalError({
        approvalId: approvalResponse.approvalId,
      });
    }

    if (toolResults[approvalRequest.toolCallId] != null) {
      continue;
    }

    const toolCall = toolCallsByToolCallId[approvalRequest.toolCallId];
    if (toolCall == null) {
      throw new ToolCallNotFoundForApprovalError({
        toolCallId: approvalRequest.toolCallId,
        approvalId: approvalRequest.approvalId,
      });
    }

    const approval: CollectedToolApprovals<TOOLS> = {
      approvalRequest,
      approvalResponse,
      toolCall,
    };

    if (approvalResponse.approved) {
      approvedToolApprovals.push(approval);
    } else {
      deniedToolApprovals.push(approval);
    }
  }

  return { approvedToolApprovals, deniedToolApprovals };
}
