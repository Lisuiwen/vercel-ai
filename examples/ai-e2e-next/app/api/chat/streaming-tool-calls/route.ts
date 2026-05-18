import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  type UIDataTypes,
  type UIMessage,
} from 'ai';
import { z } from 'zod';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

export type StreamingToolCallsMessage = UIMessage<
  never,
  UIDataTypes,
  {
    showWeatherInformation: {
      input: {
        city: string;
        weather: string;
        temperature: number;
        typicalWeather: string;
      };
      output: string;
    };
  }
>;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(messages),
    instructions:
      'You are a helpful assistant that answers questions about the weather in a given city.' +
      'You use the showWeatherInformation tool to show the weather information to the user instead of talking about it.',
    tools: {
      // 带 execute 函数的服务端 tool：
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
          return {
            weather:
              weatherOptions[Math.floor(Math.random() * weatherOptions.length)],
            temperature: Math.floor(Math.random() * 50 - 10),
          };
        },
      },
      // 向用户展示天气信息的客户端 tool：
      showWeatherInformation: {
        description:
          'Show the weather information to the user. Always use this tool to tell weather information to the user.',
        inputSchema: z.object({
          city: z.string(),
          weather: z.string(),
          temperature: z.number(),
          typicalWeather: z
            .string()
            .describe(
              '2-3 sentences about the typical weather in the city during spring.',
            ),
        }),
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
