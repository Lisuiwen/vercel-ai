import { createAgentUIStreamResponse, type UIMessage } from 'ai';
import {
  openaiMetadataAgent,
  type ExampleMetadata,
} from '@/agent/openai/metadata-agent';
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  return createAgentUIStreamResponse({
    agent: openaiMetadataAgent,
    uiMessages: messages,
    messageMetadata: ({ part }): ExampleMetadata | undefined => {
      // 在 start 时向客户端发送自定义信息：
      if (part.type === 'start') {
        return {
          createdAt: Date.now(),
          model: 'gpt-4o', // 初始 model id
        };
      }

      // 在 finish-step 时发送额外 model 信息：
      if (part.type === 'finish-step') {
        return {
          model: part.response.modelId, // 使用实际 model id 更新
        };
      }

      // 消息完成时，发送额外信息：
      if (part.type === 'finish') {
        return {
          totalTokens: part.totalUsage.totalTokens,
          finishReason: part.finishReason,
        };
      }
    },
  });
}
