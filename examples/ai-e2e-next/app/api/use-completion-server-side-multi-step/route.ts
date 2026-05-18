import { openai } from '@ai-sdk/openai';
import { isStepCount, streamText, tool } from 'ai';
import { z } from 'zod';

// 允许流式响应最长 60 秒
export const maxDuration = 60;

export async function POST(req: Request) {
  // 从请求体中提取 `prompt`
  const { prompt } = await req.json();

  const result = streamText({
    model: openai('gpt-5-mini'),
    tools: {
      weather: tool({
        description: 'Get the weather in a location',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
    },
    stopWhen: isStepCount(4),
    prompt,
  });

  // 以流响应
  return result.toUIMessageStreamResponse();
}
