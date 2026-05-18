import { openai } from '@ai-sdk/openai';
import { generateId, type ModelMessage } from 'ai';
import {
  createStreamableValue,
  getMutableAIState as $getMutableAIState,
  streamUI,
  type createAI,
} from '@ai-sdk/rsc';
import { Message, BotMessage } from './message';
import { z } from 'zod';

type AIProviderNoActions = ReturnType<typeof createAI<AIState, UIState>>;
// 未定义 actions 的类型化包装器，以避免循环依赖
const getMutableAIState = $getMutableAIState<AIProviderNoActions>;

// 获取天气数据的模拟函数
const fetchWeatherData = async (location: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { temperature: '72°F' };
};

export async function submitUserMessage(content: string) {
  'use server';

  const aiState = getMutableAIState();

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      { id: generateId(), role: 'user', content },
    ],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: React.ReactNode;

  const result = await streamUI({
    model: openai('gpt-5-mini'),
    initial: <Message role="assistant">Working on that...</Message>,
    instructions: 'You are a weather assistant.',
    messages: aiState
      .get()
      .messages.map(({ role, content }) => ({ role, content }) as ModelMessage),

    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('');
        textNode = <BotMessage textStream={textStream.value} />;
      }

      if (done) {
        textStream.done();
        aiState.update({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            { id: generateId(), role: 'assistant', content },
          ],
        });
      } else {
        textStream.append(delta);
      }

      return textNode;
    },
    tools: {
      get_current_weather: {
        description: 'Get the current weather',
        inputSchema: z.object({
          location: z.string(),
        }),
        generate: async function* ({ location }) {
          yield (
            <Message role="assistant">Loading weather for {location}</Message>
          );
          const { temperature } = await fetchWeatherData(location);
          return (
            <Message role="assistant">
              <span>
                The temperature in {location} is{' '}
                <span className="font-semibold">{temperature}</span>
              </span>
            </Message>
          );
        },
      },
    },
    onFinish: event => {
      // 你自己的逻辑，例如保存聊天历史或记录用量
      console.log(`[onFinish]: ${JSON.stringify(event, null, 2)}`);
    },
  });

  return {
    id: generateId(),
    display: result.value,
  };
}

export type ClientMessage = ModelMessage & {
  id: string;
};

export type AIState = {
  chatId: string;
  messages: ClientMessage[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];
