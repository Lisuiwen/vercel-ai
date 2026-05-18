import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

// 简单缓存实现，生产环境请使用 Vercel KV 或类似服务
const cache = new Map<string, string>();

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 根据请求生成 key：
  const key = JSON.stringify(messages);

  // 检查是否有缓存的响应
  const cached = cache.get(key);
  if (cached != null) {
    return new Response(`data: ${cached}\n\n`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 调用语言模型：
  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    async onFinish({ text }) {
      // 缓存响应文本：
      cache.set(key, text);
    },
  });

  // 以流响应
  return result.toUIMessageStreamResponse();
}
