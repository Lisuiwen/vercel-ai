import { anthropicCodeExecutionAgent } from '@/agent/anthropic/code-execution-agent';
import type { AnthropicMessageMetadata } from '@ai-sdk/anthropic';
import {
  createAgentUIStreamResponse,
  validateUIMessages,
  type UIMessage,
} from 'ai';
export async function POST(request: Request) {
  const { messages } = await request.json();

  console.dir(messages, { depth: Infinity });

  const uiMessages = await validateUIMessages<
    UIMessage<{ containerId: string }>
  >({ messages });

  // 获取最后一条 assistant 消息以复用 container id
  const lastAssistantMessage = uiMessages.findLast(
    message => message.role === 'assistant',
  );

  return createAgentUIStreamResponse({
    agent: anthropicCodeExecutionAgent,
    uiMessages: messages,
    messageMetadata({ part }) {
      // 若使用了 container，则存储 anthropic container id
      if (part.type === 'finish-step') {
        const anthropicContainer = (
          part.providerMetadata
            ?.anthropic as unknown as AnthropicMessageMetadata
        )?.container;

        return {
          containerId: anthropicContainer?.id,
        };
      }
    },
    options: {
      containerId: lastAssistantMessage?.metadata?.containerId,
    },
  });
}
