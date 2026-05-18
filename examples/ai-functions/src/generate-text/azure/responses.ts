import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import { run } from '../../lib/run';

// 初始化 Azure OpenAI 提供程序
const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME,
  apiKey: process.env.AZURE_API_KEY,
});

run(async () => {
  // 基本文本生成
  const basicResult = await generateText({
    model: azure.responses('gpt-4.1-mini'),
    prompt: 'What is quantum computing?',
  });

  console.log('\n=== Basic Text Generation ===');
  console.log(basicResult.text);
});
