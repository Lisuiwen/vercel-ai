import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  type InferUITools,
  type UIDataTypes,
  type UIMessage,
} from 'ai';
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test';
import { z } from 'zod';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

const getWeatherInformationTool = tool({
  description: 'show the weather in a given city to the user',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }: { city: string }) => {
    // 人为增加 5 秒延迟
    await new Promise(resolve => setTimeout(resolve, 5000));

    const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
    return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  },
});

const tools = {
  // 带 execute 函数的服务端 tool：
  getWeatherInformation: getWeatherInformationTool,
} as const;

export type UseChatToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log('messages', JSON.stringify(messages, null, 2));

  const result = streamText({
    model: openai('gpt-4o'),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5), // 服务端 tools 的多步执行
    tools,
    prepareStep: async ({ stepNumber }) => {
      // 在第一步注入无效的 tool 调用：
      if (stepNumber === 0) {
        return {
          model: new MockLanguageModelV3({
            doStream: async () => ({
              stream: convertArrayToReadableStream([
                { type: 'stream-start', warnings: [] },
                {
                  type: 'tool-input-start',
                  id: 'call-1',
                  toolName: 'getWeatherInformation',
                  providerExecuted: true,
                },
                {
                  type: 'tool-input-delta',
                  id: 'call-1',
                  delta: `{ "cities": "San Francisco" }`,
                },
                {
                  type: 'tool-input-end',
                  id: 'call-1',
                },
                {
                  type: 'tool-call',
                  toolCallType: 'function',
                  toolCallId: 'call-1',
                  toolName: 'getWeatherInformation',
                  // 错误的 tool 调用参数（city 与 cities）：
                  input: `{ "cities": "San Francisco" }`,
                },
                {
                  type: 'finish',
                  finishReason: { raw: undefined, unified: 'stop' },
                  usage: {
                    inputTokens: {
                      total: 10,
                      noCache: 10,
                      cacheRead: undefined,
                      cacheWrite: undefined,
                    },
                    outputTokens: {
                      total: 20,
                      text: 20,
                      reasoning: undefined,
                    },
                  },
                },
              ]),
            }),
          }),
        };
      }
    },
  });

  return result.toUIMessageStreamResponse({
    //  originalMessages: messages, //若需要正确的 id 请添加
    onFinish: options => {
      console.log('onFinish', options);
    },
  });
}
