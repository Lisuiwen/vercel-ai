import { createUIMessageStreamResponse, simulateReadableStream } from 'ai';

export async function POST(req: Request) {
  return createUIMessageStreamResponse({
    stream: simulateReadableStream({
      initialDelayInMs: 0, // 首个 chunk 之前的延迟
      chunkDelayInMs: 0, // chunk 之间的延迟
      chunks: [
        {
          type: 'start',
        },
        {
          type: 'start-step',
        },
        ...Array(5000).fill({ type: 'text', value: 'T\n' }),
        {
          type: 'finish-step',
        },
        {
          type: 'finish',
        },
      ],
    }),
  });
}
