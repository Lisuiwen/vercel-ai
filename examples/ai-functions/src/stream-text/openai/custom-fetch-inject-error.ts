import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { run } from '../../lib/run';

const openai = createOpenAI({
  // 示例 fetch 包装器在 1000 个字符后注入错误：
  fetch: async (url, options) => {
    const result = await fetch(url, options);

    // 拦截响应流
    const originalBody = result.body;
    if (originalBody) {
      const reader = originalBody.getReader();
      let characterCount = 0;

      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            characterCount += value.length;
            controller.enqueue(value);

            if (characterCount > 1000) {
              controller.error(
                new Error('Injected error after 1000 characters'),
              );
              break;
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: result.headers,
        status: result.status,
        statusText: result.statusText,
      });
    }

    return result;
  },
});

run(async () => {
  const result = streamText({
    model: openai('gpt-3.5-turbo'),
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  for await (const part of result.fullStream) {
    process.stdout.write(JSON.stringify(part));
  }

  console.log();
  console.log('Token usage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
});
