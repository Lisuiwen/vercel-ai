'use client';

import { useChat } from '@ai-sdk/react';
import ChatInput from '@/components/chat-input';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import type { StreamingToolCallsMessage } from '@/app/api/chat/streaming-tool-calls/route';

export default function Chat() {
  const { messages, status, sendMessage, addToolOutput } =
    useChat<StreamingToolCallsMessage>({
      transport: new DefaultChatTransport({
        api: '/api/chat/streaming-tool-calls',
      }),

      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

      // 运行自动执行的客户端 tools：
      async onToolCall({ toolCall }) {
        if (toolCall.toolName === 'showWeatherInformation') {
          // 展示 tool。添加告知 LLM 该 tool 已执行的 tool 结果。
          addToolOutput({
            tool: 'showWeatherInformation',
            toolCallId: toolCall.toolCallId,
            output: 'Weather information was shown to the user.',
          });
        }
      },
    });

  // 仅在 role 变化时渲染：
  let lastRole: string | undefined = undefined;

  return (
    <div className="flex flex-col py-24 mx-auto w-full max-w-md stretch">
      {messages?.map(m => {
        const isNewRole = m.role !== lastRole;
        lastRole = m.role;

        return (
          <div key={m.id} className="whitespace-pre-wrap">
            {isNewRole && <strong>{`${m.role}: `}</strong>}
            {m.parts.map(part => {
              if (part.type === 'text') {
                return part.text;
              }

              if (part.type === 'tool-showWeatherInformation') {
                return (
                  <div
                    key={part.toolCallId}
                    className="p-4 my-2 text-gray-500 rounded border border-gray-300"
                  >
                    <h4 className="mb-2">{part.input?.city ?? ''}</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {part.input?.weather && <b>{part.input.weather}</b>}
                        {part.input?.temperature && (
                          <b>{part.input.temperature} &deg;C</b>
                        )}
                      </div>
                      {part.input?.typicalWeather && (
                        <div>{part.input.typicalWeather}</div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        );
      })}

      <ChatInput status={status} onSubmit={text => sendMessage({ text })} />
    </div>
  );
}
