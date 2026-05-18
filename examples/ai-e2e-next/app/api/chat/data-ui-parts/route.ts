import { openai } from '@ai-sdk/openai';
import { delay } from '@ai-sdk/provider-utils';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
} from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const result = streamText({
        model: openai('gpt-4o'),
        stopWhen: isStepCount(2),
        tools: {
          weather: {
            description: 'Get the weather in a city',
            inputSchema: z.object({
              city: z.string(),
            }),
            execute: async ({ city }, { toolCallId }) => {
              // 更新显示
              writer.write({
                type: 'data-weather',
                id: toolCallId,
                data: { city, status: 'loading' },
              });

              await delay(2000); // 模拟延迟
              const weather = 'sunny';

              // 更新显示
              writer.write({
                type: 'data-weather',
                id: toolCallId,
                data: { city, weather, status: 'success' },
              });

              // 用于 LLM 往返
              return { city, weather };
            },
          },
        },
        messages: modelMessages,
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
