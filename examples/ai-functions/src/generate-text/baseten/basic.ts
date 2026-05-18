import { baseten } from '@ai-sdk/baseten';
import { generateText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  // 使用默认模型 API - 适用于 Baseten 上的托管模型
  const { text, usage } = await generateText({
    model: baseten('deepseek-ai/DeepSeek-V3-0324'),
    prompt: 'What is the meaning of life? Answer in one sentence.',
  });

  console.log(text);
  console.log();
  console.log('Usage:', usage);
});
