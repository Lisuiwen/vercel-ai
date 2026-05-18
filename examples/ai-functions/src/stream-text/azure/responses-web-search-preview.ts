import { azure } from '@ai-sdk/azure';
import { streamText } from 'ai';
import { run } from '../../lib/run';

/**
 * 准备
 * 请在 .env 文件中添加参数以初始化 Azure OpenAI。
 * AZURE_RESOURCE_NAME="<your_resource_name>"
 * AZURE_API_KEY="<your_api_key>"
 */

run(async () => {
  // 基本文本生成
  const result = streamText({
    model: azure.responses('gpt-4.1-mini'), // 使用您自己的部署
    prompt: 'Summarize three major news stories from today.',
    tools: {
      web_search_preview: azure.tools.webSearchPreview({
        searchContextSize: 'low',
      }),
    },
  });

  console.log('\n=== Basic Text Generation ===');
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
  console.log('\n=== Other Outputs ===');
  console.log(await result.toolCalls);
  console.log(await result.toolResults);
  console.log('\n=== Web Search Preview Annotations ===');
  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-end':
        {
          const annotations = part.providerMetadata?.azure?.annotations;
          if (annotations) {
            console.dir(annotations);
          }
        }
        break;

      case 'source':
        if (part.sourceType === 'url') {
          console.log(`\n[source: ${part.url}]`);
        }
        break;

      case 'error':
        console.log('error');
        console.error(part.error);
        break;
    }
  }
});
