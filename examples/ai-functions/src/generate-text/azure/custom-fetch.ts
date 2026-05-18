import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import { run } from '../../lib/run';

const azure = createAzure({
  // 记录 API 调用输入的 fetch 包装器示例：
  fetch: async (url, options) => {
    console.log('URL', url);
    console.log('Headers', JSON.stringify(options!.headers, null, 2));
    console.log(
      `Body ${JSON.stringify(JSON.parse(options!.body! as string), null, 2)}`,
    );
    return await fetch(url, options);
  },
});

run(async () => {
  const result = await generateText({
    model: azure('gpt-4.1-mini'), // 使用您自己的部署
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  console.log(result.text);
});
