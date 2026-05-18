import type {
  AssistantContent,
  AssistantModelMessage,
  ToolContent,
  ToolModelMessage,
} from '../prompt';
import { createToolModelOutput } from '../prompt/create-tool-model-output';
import type { ContentPart } from './content-part';
import type { ToolSet } from '@ai-sdk/provider-utils';

/**
 * 将 `generateText` 或 `streamText` 调用的结果转换为响应消息列表。
 */
export async function toResponseMessages<TOOLS extends ToolSet>({
  content: inputContent,
  tools,
}: {
  content: Array<ContentPart<TOOLS>>;
  tools: TOOLS | undefined;
}): Promise<Array<AssistantModelMessage | ToolModelMessage>> {
  const responseMessages: Array<AssistantModelMessage | ToolModelMessage> = [];

  const content: AssistantContent = [];
  for (const part of inputContent) {
    // 跳过来源 - 它们是仅响应的内容，没有提供商期望返回
    if (part.type === 'source') {
      continue;
    }

    // 跳过非提供商执行的工具结果/错误（它们位于工具消息中）
    if (
      (part.type === 'tool-result' || part.type === 'tool-error') &&
      !part.providerExecuted
    ) {
      continue;
    }

    // 跳过空文本
    if (part.type === 'text' && part.text.length === 0) {
      continue;
    }

    switch (part.type) {
      case 'text':
        content.push({
          type: 'text',
          text: part.text,
          providerOptions: part.providerMetadata,
        });
        break;
      case 'custom':
        content.push({
          type: 'custom',
          kind: part.kind,
          providerOptions: part.providerMetadata,
        });
        break;
      case 'reasoning':
        content.push({
          type: 'reasoning',
          text: part.text,
          providerOptions: part.providerMetadata,
        });
        break;
      case 'file':
        content.push({
          type: 'file',
          data: part.file.base64,
          mediaType: part.file.mediaType,
          providerOptions: part.providerMetadata,
        });
        break;
      case 'reasoning-file':
        content.push({
          type: 'reasoning-file',
          data: part.file.base64,
          mediaType: part.file.mediaType,
          providerOptions: part.providerMetadata,
        });
        break;
      case 'tool-call':
        content.push({
          type: 'tool-call',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          input:
            part.invalid && typeof part.input !== 'object' ? {} : part.input,
          providerExecuted: part.providerExecuted,
          providerOptions: part.providerMetadata,
        });
        break;
      case 'tool-result': {
        const output = await createToolModelOutput({
          toolCallId: part.toolCallId,
          input: part.input,
          tool: tools?.[part.toolName],
          output: part.output,
          errorMode: 'none',
        });
        content.push({
          type: 'tool-result',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          output,
          providerOptions: part.providerMetadata,
        });
        break;
      }
      case 'tool-error': {
        const output = await createToolModelOutput({
          toolCallId: part.toolCallId,
          input: part.input,
          tool: tools?.[part.toolName],
          output: part.error,
          errorMode: 'json',
        });
        content.push({
          type: 'tool-result',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          output,
          providerOptions: part.providerMetadata,
        });
        break;
      }
      case 'tool-approval-request':
        content.push({
          type: 'tool-approval-request',
          approvalId: part.approvalId,
          toolCallId: part.toolCall.toolCallId,
          isAutomatic: part.isAutomatic,
        });
        break;
    }
  }

  if (content.length > 0) {
    responseMessages.push({
      role: 'assistant',
      content,
    });
  }

  const toolResultContent: ToolContent = [];
  for (const part of inputContent) {
    if (
      part.type !== 'tool-approval-response' &&
      part.type !== 'tool-result' &&
      part.type !== 'tool-error'
    ) {
      continue;
    }

    if (part.type === 'tool-approval-response') {
      toolResultContent.push({
        type: 'tool-approval-response',
        approvalId: part.approvalId,
        approved: part.approved,
        reason: part.reason,
        providerExecuted: part.providerExecuted,
      });

      // 当工具批准被拒绝时，
      // 我们需要添加一个拒绝执行的工具结果
      // 因为工具调用没有相应的工具结果
      if (part.approved === false) {
        toolResultContent.push({
          type: 'tool-result',
          toolCallId: part.toolCall.toolCallId,
          toolName: part.toolCall.toolName,
          output: {
            type: 'execution-denied' as const,
            reason: part.reason,
          },
        });
      }
      continue;
    }

    if (part.providerExecuted) {
      continue;
    }

    const output = await createToolModelOutput({
      toolCallId: part.toolCallId,
      input: part.input,
      tool: tools?.[part.toolName],
      output: part.type === 'tool-result' ? part.output : part.error,
      errorMode: part.type === 'tool-error' ? 'text' : 'none',
    });

    toolResultContent.push({
      type: 'tool-result',
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      output,
      ...(part.providerMetadata != null
        ? { providerOptions: part.providerMetadata }
        : {}),
    });
  }

  if (toolResultContent.length > 0) {
    responseMessages.push({
      role: 'tool',
      content: toolResultContent,
    });
  }

  return responseMessages;
}
