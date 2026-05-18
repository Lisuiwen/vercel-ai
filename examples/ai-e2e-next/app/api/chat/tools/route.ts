import {
  openai,
  type OpenAILanguageModelResponsesOptions,
} from '@ai-sdk/openai';
import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  validateUIMessages,
  type InferUITools,
  type UIDataTypes,
  type UIMessage,
} from 'ai';
import { z } from 'zod';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

const getWeatherInformationTool = tool({
  description: 'show the weather in a given city to the user',
  inputSchema: z.object({ city: z.string() }),
  async *execute({ city }: { city: string }, { messages }) {
    yield { state: 'loading' as const };

    // 统计 assistant 消息数量；若 ≤2 则抛出错误
    const assistantMessageCount = messages.filter(
      message => message.role === 'assistant',
    ).length;

    // if (assistantMessageCount <= 2) {
    //   throw new Error('could not get weather information');
    // }

    // 人为增加 5 秒延迟
    await new Promise(resolve => setTimeout(resolve, 5000));

    const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
    const weather =
      weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

    yield {
      state: 'ready' as const,
      temperature: 72,
      weather,
    };
  },

  onInputStart: () => {
    console.log('onInputStart');
  },
  onInputDelta: ({ inputTextDelta }) => {
    console.log('onInputDelta', inputTextDelta);
  },
  onInputAvailable: ({ input }) => {
    console.log('onInputAvailable', input);
  },
});

const askForConfirmationTool = tool({
  description: 'Ask the user for confirmation.',
  inputSchema: z.object({
    message: z.string().describe('The message to ask for confirmation.'),
  }),
  outputSchema: z.string(),
});

const getLocationTool = tool({
  description:
    'Get the user location. Always ask for confirmation before using this tool.',
  inputSchema: z.object({}),
  outputSchema: z.string(),
});

const tools = {
  // 带 execute 函数的服务端 tool：
  getWeatherInformation: getWeatherInformationTool,
  // 发起用户交互的客户端 tool：
  askForConfirmation: askForConfirmationTool,
  // 在客户端自动执行的客户端 tool：
  getLocation: getLocationTool,
} as const;

export type UseChatToolsMessage = UIMessage<
  never,
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const body = await req.json();

  const messages = await validateUIMessages<UseChatToolsMessage>({
    messages: body.messages,
    tools,
  });

  const result = streamText({
    model: openai('gpt-5-mini'),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5), // 服务端 tools 的多步执行
    tools,
    providerOptions: {
      openai: {
        // store: false,
      } satisfies OpenAILanguageModelResponsesOptions,
    },
    onStepFinish({ request }) {
      console.dir(request.body, { depth: Infinity });
    },
  });

  return result.toUIMessageStreamResponse({
    //  originalMessages: messages, //若需要正确的 id 请添加
    onFinish: options => {
      console.log('onFinish', options);
    },
  });
}
