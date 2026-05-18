import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

export async function POST(req: Request) {
  // 从请求体中提取 `prompt`
  const { prompt } = await req.json();

  // 根据 prompt 向 OpenAI 请求流式补全
  const result = streamText({
    model: openai('gpt-3.5-turbo-instruct'),
    prompt,
  });

  // 以流响应
  return result.toUIMessageStreamResponse();
}
