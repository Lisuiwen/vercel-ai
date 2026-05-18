import type {
  AssistantModelMessage,
  ModelMessage,
  ToolModelMessage,
} from '@ai-sdk/provider-utils';

/**
 * 从模型消息列表中删除模型消息。
 *
 * @param messages - 要修剪的模型消息列表。
 * @param reasoning - 如何从助理消息中删除推理内容。默认为`无`。
 * @param toolCalls - 如何修剪工具调用/结果/批准内容。默认为`[]`。
 * @param emptyMessages - 修剪后是否保留或删除内容为空的消息。默认为`删除`。
 *
 * @returns 模型消息的修剪列表。
 */
export function pruneMessages({
  messages,
  reasoning = 'none',
  toolCalls = [],
  emptyMessages = 'remove',
}: {
  messages: ModelMessage[];
  reasoning?: 'all' | 'before-last-message' | 'none';
  toolCalls?:
    | 'all'
    | 'before-last-message'
    | `before-last-${number}-messages`
    | 'none'
    | Array<{
        type: 'all' | 'before-last-message' | `before-last-${number}-messages`;
        tools?: string[];
      }>;
  emptyMessages?: 'keep' | 'remove';
}): ModelMessage[] {
  // 过滤推理部分：
  if (reasoning === 'all' || reasoning === 'before-last-message') {
    messages = messages.map((message, messageIndex) => {
      if (
        message.role !== 'assistant' ||
        typeof message.content === 'string' ||
        (reasoning === 'before-last-message' &&
          messageIndex === messages.length - 1)
      ) {
        return message;
      }

      return {
        ...message,
        content: message.content.filter(part => part.type !== 'reasoning'),
      };
    });
  }

  // 过滤工具调用、结果、错误和批准：
  if (toolCalls === 'none') {
    toolCalls = [];
  } else if (toolCalls === 'all') {
    toolCalls = [{ type: 'all' }];
  } else if (toolCalls === 'before-last-message') {
    toolCalls = [{ type: 'before-last-message' }];
  } else if (typeof toolCalls === 'string') {
    toolCalls = [{ type: toolCalls }];
  }

  for (const toolCall of toolCalls) {
    // 确定要保留多少尾随消息：
    const keepLastMessagesCount =
      toolCall.type === 'all'
        ? undefined
        : toolCall.type === 'before-last-message'
          ? 1
          : Number(
              toolCall.type
                .slice('before-last-'.length)
                .slice(0, -'-messages'.length),
            );

    // 扫描保留的消息以识别需要保留的工具调用和批准：
    const keptToolCallIds: Set<string> = new Set();
    const keptApprovalIds: Set<string> = new Set();

    if (keepLastMessagesCount != null) {
      for (const message of messages.slice(-keepLastMessagesCount)) {
        if (
          (message.role === 'assistant' || message.role === 'tool') &&
          typeof message.content !== 'string'
        ) {
          for (const part of message.content) {
            if (part.type === 'tool-call' || part.type === 'tool-result') {
              keptToolCallIds.add(part.toolCallId);
            } else if (
              part.type === 'tool-approval-request' ||
              part.type === 'tool-approval-response'
            ) {
              keptApprovalIds.add(part.approvalId);
            }
          }
        }
      }
    }

    messages = messages.map((message, messageIndex) => {
      if (
        (message.role !== 'assistant' && message.role !== 'tool') ||
        typeof message.content === 'string' ||
        (keepLastMessagesCount &&
          messageIndex >= messages.length - keepLastMessagesCount)
      ) {
        return message;
      }

      const toolCallIdToToolName: Record<string, string> = {};
      const approvalIdToToolName: Record<string, string> = {};

      return {
        ...message,
        content: message.content.filter(part => {
          // 保留非工具零件：
          if (
            part.type !== 'tool-call' &&
            part.type !== 'tool-result' &&
            part.type !== 'tool-approval-request' &&
            part.type !== 'tool-approval-response'
          ) {
            return true;
          }

          // 跟踪工具调用和批准：
          if (part.type === 'tool-call') {
            toolCallIdToToolName[part.toolCallId] = part.toolName;
          } else if (part.type === 'tool-approval-request') {
            approvalIdToToolName[part.approvalId] =
              toolCallIdToToolName[part.toolCallId];
          }

          // 保留与需要保留的工具调用或批准关联的部分：
          if (
            ((part.type === 'tool-call' || part.type === 'tool-result') &&
              keptToolCallIds.has(part.toolCallId)) ||
            ((part.type === 'tool-approval-request' ||
              part.type === 'tool-approval-response') &&
              keptApprovalIds.has(part.approvalId))
          ) {
            return true;
          }

          // 保留与应移除的工具无关的部件：
          return (
            toolCall.tools != null &&
            !toolCall.tools.includes(
              part.type === 'tool-call' || part.type === 'tool-result'
                ? part.toolName
                : approvalIdToToolName[part.approvalId],
            )
          );
        }),
      } as AssistantModelMessage | ToolModelMessage;
    });
  }

  if (emptyMessages === 'remove') {
    messages = messages.filter(message => message.content.length > 0);
  }

  return messages;
}
