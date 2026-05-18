import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  streamText,
  createUIMessageStream,
  convertToModelMessages,
  isStepCount,
} from 'ai';
import { processToolCalls } from './utils';
import { tools } from './tools';
import type { HumanInTheLoopUIMessage } from './types';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: HumanInTheLoopUIMessage[] } =
    await req.json();

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      // 处理需要人工确认的 tools 的工具函数
      // 在最后一条消息中检查确认，然后运行关联的 tool
      const processedMessages = await processToolCalls(
        {
          messages,
          writer,
          tools,
        },
        {
          // 无 execute 函数的 tools 的类型安全对象
          getWeatherInformation: async ({ city }) => {
            const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
            return `The weather in ${city} is ${
              conditions[Math.floor(Math.random() * conditions.length)]
            }.`;
          },
        },
      );

      const result = streamText({
        model: openai('gpt-4o'),
        messages: await convertToModelMessages(processedMessages),
        tools,
        stopWhen: isStepCount(20),
      });

      writer.merge(
        result.toUIMessageStream({ originalMessages: processedMessages }),
      );
    },
    onStepFinish: ({ messages, responseMessage }) => {
      console.log('--- Step finished ---');
      console.log('Parts count:', responseMessage.parts.length);
      console.log('Messages:', JSON.stringify(messages, null, 2));
    },
    onFinish: ({}) => {
      // 在此保存消息
      console.log('Finished!');
    },
  });

  return createUIMessageStreamResponse({ stream });
}
