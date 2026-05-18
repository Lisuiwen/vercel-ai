import { azure, type AzureResponsesTextProviderMetadata } from '@ai-sdk/azure';
import { generateText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: azure('gpt-4.1-mini'),
    prompt:
      'Create a program that generates five random numbers between 1 and 100 with two decimal places, and show me the execution results. Also save the result to a file.',
    tools: {
      code_interpreter: azure.tools.codeInterpreter(),
      web_search_preview: azure.tools.webSearchPreview({}),
      file_search: azure.tools.fileSearch({ vectorStoreIds: ['vs_1234'] }), // 需要一个已配置的向量存储
    },
  });

  for (const part of result.content) {
    if (part.type === 'text') {
      const providerMetadata = part.providerMetadata as
        | AzureResponsesTextProviderMetadata
        | undefined;
      if (!providerMetadata) continue;
      const { itemId: _itemId, annotations } = providerMetadata.azure;

      if (!annotations) continue;
      for (const annotation of annotations) {
        switch (annotation.type) {
          case 'url_citation':
            // url_引用从 web_search 返回并提供：
            // 属性：类型、url、标题、start_index 和 end_index
            break;
          case 'file_citation':
            // file_引用从 file_search 返回并提供：
            // 属性：类型、file_id、文件名和索引
            break;
          case 'container_file_citation':
            // container_file_引用从 code_interpreter 返回并提供：
            // 属性：类型、container_id、file_id、文件名、start_index 和 end_index
            break;
          case 'file_path':
            // file_path 提供：
            // 属性：类型、file_id 和索引
            break;
          default: {
            const _exhaustiveCheck: never = annotation;
            throw new Error(
              `Unhandled annotation: ${JSON.stringify(_exhaustiveCheck)}`,
            );
          }
        }
      }
    }
  }
});
