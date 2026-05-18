import { azure } from '@ai-sdk/azure';
import { streamText } from 'ai';
import { run } from '../../lib/run';

/**
 * *** 注意 ***
 * 完成 API 可能不可用。
 */

run(async () => {
  const result = streamText({
    model: azure.completion('gpt-35-turbo'), // 使用您自己的部署
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
});
