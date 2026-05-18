import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { messages } = await request.body;

  const result = streamText({
    model: openai('gpt-5-mini'),
    messages,
  });

  // 将数据流写入响应
  // 注意：这会作为单个响应发送，而不是流
  result.pipeUIMessageStreamToResponse(response);
}
