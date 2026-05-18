import { openai } from '@ai-sdk/openai';
import { saveChat } from '@util/chat-store';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';
export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
    await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: await convertToModelMessages(messages),
  });

  // 消费流以确保运行完成并触发 onFinish
  // 即使客户端响应被中止（例如关闭浏览器标签页）。
  // 不使用 await
  result.consumeStream({
    onError: error => {
      console.log('Error during background stream consumption: ', error); // 可选的错误回调
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages }) => {
      saveChat({ chatId, messages });
    },
  });
}
