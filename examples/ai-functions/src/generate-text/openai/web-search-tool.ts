import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: openai.responses('gpt-5-mini'),
    prompt:
      'What happened in tech news today? Open a few pages and search for a key word pattern vercel on those pages.',
    tools: {
      web_search: openai.tools.webSearch({
        searchContextSize: 'medium',
      }),
    },
  });

  // 输出为有效 JSON，可以复制粘贴到 JSON 文件中
  console.log(JSON.stringify(result.response.body, null, 2));
  console.log(JSON.stringify(result.toolCalls, null, 2));
  console.log(JSON.stringify(result.toolResults, null, 2));
  console.log(JSON.stringify(result.sources, null, 2));
  console.log(result.text);
});
