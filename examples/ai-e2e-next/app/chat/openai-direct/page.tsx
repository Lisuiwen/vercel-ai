'use client';

import { useChat } from '@ai-sdk/react';
import { DirectChatTransport, ToolLoopAgent } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import ChatInput from '@/components/chat-input';

/**
 * 警告：此示例仅用于测试/演示。
 *
 * 请勿用于生产环境！在客户端代码中暴露 OpenAI API 密钥存在安全风险。任何人都可以在浏览器中查看该密钥并用于自己的目的，可能在你的账户上产生费用。
 *
 * 生产环境请使用 DefaultChatTransport 配合服务端 API 路由。
 *
 * 在没有 API 密钥时（例如调用设备端、浏览器内或本地模型）可使用直接调用。
 */
const openai = createOpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const agent = new ToolLoopAgent({
  model: openai('gpt-4o-mini'),
  instructions: 'You are a helpful assistant.',
});

export default function Chat() {
  const { error, status, sendMessage, messages, regenerate, stop } = useChat({
    transport: new DirectChatTransport({ agent }),
  });

  return (
    <div className="flex flex-col py-24 mx-auto w-full max-w-md stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.parts.map(part => {
            if (part.type === 'text') {
              return part.text;
            }
          })}
        </div>
      ))}

      {(status === 'submitted' || status === 'streaming') && (
        <div className="mt-4 text-gray-500">
          {status === 'submitted' && <div>Loading...</div>}
          <button
            type="button"
            className="px-4 py-2 mt-4 text-blue-500 rounded-md border border-blue-500"
            onClick={stop}
          >
            Stop
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <div className="text-red-500">An error occurred.</div>
          <button
            type="button"
            className="px-4 py-2 mt-4 text-blue-500 rounded-md border border-blue-500"
            onClick={() => regenerate()}
          >
            Retry
          </button>
        </div>
      )}

      <ChatInput status={status} onSubmit={text => sendMessage({ text })} />
    </div>
  );
}
