import { mistral } from '@ai-sdk/mistral';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
// 允许流式响应最长 30 秒
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: mistral('mistral-small-latest'),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
