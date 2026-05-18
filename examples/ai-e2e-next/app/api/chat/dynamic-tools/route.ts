import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  dynamicTool,
  isStepCount,
  streamText,
  tool,
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  type UIMessage,
} from 'ai';
import { z } from 'zod';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

const getWeatherInformationTool = tool({
  description: 'show the weather in a given city to the user',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }: { city: string }, { messages }) => {
    // 统计 assistant 消息数量；若 ≤2 则抛出错误
    const assistantMessageCount = messages.filter(
      message => message.role === 'assistant',
    ).length;

    if (assistantMessageCount <= 2) {
      throw new Error('could not get weather information');
    }

    // 人为增加 5 秒延迟
    await new Promise(resolve => setTimeout(resolve, 5000));

    const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
    return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  },
});

const staticTools = {
  // 带 execute 函数的服务端 tool：
  getWeatherInformation: getWeatherInformationTool,
} as const;

export type ToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof staticTools>
>;

function dynamicTools(): ToolSet {
  return {
    currentLocation: dynamicTool({
      description: 'Get the current location.',
      inputSchema: z.object({}),
      execute: async () => {
        const locations = ['New York', 'London', 'Paris'];
        return {
          location: locations[Math.floor(Math.random() * locations.length)],
        };
      },
    }),
  };
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5), // 服务端 tools 的多步执行
    tools: {
      ...staticTools,
      ...dynamicTools(),
    },
  });

  return result.toUIMessageStreamResponse({
    //  originalMessages: messages, //若需要正确的 id 请添加
    onFinish: options => {
      console.log('onFinish', options);
    },
  });
}
