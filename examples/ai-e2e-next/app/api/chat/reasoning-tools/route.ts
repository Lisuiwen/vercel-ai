import {
  openai,
  type OpenAILanguageModelResponsesOptions,
} from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  type InferUITools,
  type UIDataTypes,
  type UIMessage,
} from 'ai';
const tools = {
  web_search: openai.tools.webSearch({
    searchContextSize: 'high',
    userLocation: {
      type: 'approximate',
      city: 'San Francisco',
      region: 'California',
      country: 'US',
    },
  }),
} as const;

export type ReasoningToolsMessage = UIMessage<
  never, // 可在此定义 metadata
  UIDataTypes, // 可在此定义 data parts
  InferUITools<typeof tools>
>;

// 允许流式响应最长 30 秒
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log(JSON.stringify(messages, null, 2));

  const result = streamText({
    model: openai('gpt-5'),
    messages: await convertToModelMessages(messages),
    tools,
    providerOptions: {
      openai: {
        reasoningSummary: 'detailed', // 'auto' 为精简版，'detailed' 为完整版
      } satisfies OpenAILanguageModelResponsesOptions,
    },
  });

  return result.toUIMessageStreamResponse();
}
