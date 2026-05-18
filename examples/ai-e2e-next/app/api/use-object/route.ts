import { Output, streamText } from 'ai';
import { notificationSchema } from './schema';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

export async function POST(req: Request) {
  const context = await req.json();

  const result = streamText({
    model: 'openai/gpt-4o',
    prompt: `Generate 3 notifications for a messages app in this context: ${context}`,
    output: Output.object({ schema: notificationSchema }),
  });

  return result.toTextStreamResponse();
}
