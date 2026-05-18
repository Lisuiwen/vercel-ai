import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  streamText,
  createUIMessageStream,
  convertToModelMessages,
  isStepCount,
} from 'ai';
import { createMCPClient, ElicitationRequestSchema } from '@ai-sdk/mcp';
import type { MCPElicitationUIMessage } from './types';
import { createPendingElicitation } from './elicitation-store';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: MCPElicitationUIMessage[] } =
    await req.json();

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      return processMessages(messages, writer);
    },
  });

  return createUIMessageStreamResponse({ stream });
}

async function processMessages(
  messages: MCPElicitationUIMessage[],
  writer: any,
) {
  // 创建支持征询能力的 MCP 客户端
  const mcpClient = await createMCPClient({
    transport: {
      type: 'sse',
      url: 'http://localhost:8085/sse',
    },
    capabilities: {
      elicitation: {},
    },
  });

  // 处理来自 MCP 服务器的征询请求
  mcpClient.onElicitationRequest(ElicitationRequestSchema, async request => {
    const elicitationId = `elicit-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    try {
      // 向前端发送征询请求
      writer.write({
        type: 'data-elicitation-request',
        id: elicitationId,
        data: {
          elicitationId,
          message: request.params.message,
          requestedSchema: request.params.requestedSchema,
        },
      });

      // 等待用户响应（将通过 /respond 端点 resolve）
      const userResponse = await createPendingElicitation(elicitationId);

      // 以 MCP 服务器期望的格式返回响应
      return {
        action: userResponse.action,
        content:
          userResponse.action === 'accept' ? userResponse.content : undefined,
      };
    } catch (error) {
      // 出错时返回拒绝响应
      return {
        action: 'decline' as const,
      };
    }
  });

  try {
    const tools = await mcpClient.tools();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      tools,
      stopWhen: isStepCount(10),
      onStepFinish: async ({ toolResults }) => {
        if (toolResults.length > 0) {
          console.log('TOOL RESULTS:', JSON.stringify(toolResults, null, 2));
        }
      },
      instructions:
        'You are a helpful assistant. When asked to register a user, use the register_user tool.',
      messages: await convertToModelMessages(messages),
      onFinish: async () => {
        await mcpClient.close();
      },
    });

    writer.merge(result.toUIMessageStream({ originalMessages: messages }));
  } catch (error) {
    console.error('Error processing messages:', error);
    await mcpClient.close();
    throw error;
  }
}
