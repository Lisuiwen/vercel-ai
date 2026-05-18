import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { run } from '../../lib/run';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  headers: {
    'custom-provider-header': 'value-1',
  },
  // 获取包装器以记录标头：
  fetch: async (url, options) => {
    console.log('Headers', options?.headers);
    return fetch(url, options);
  },
});

run(async () => {
  const result = await generateText({
    model: openai('gpt-3.5-turbo'),
    prompt: 'Invent a new holiday and describe its traditions.',
    maxOutputTokens: 50,
    headers: {
      'custom-request-header': 'value-2',
    },
  });

  console.log(result.text);
});
