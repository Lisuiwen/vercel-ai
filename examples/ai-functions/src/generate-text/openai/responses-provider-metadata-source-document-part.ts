import {
  openai,
  type OpenaiResponsesSourceDocumentProviderMetadata,
} from '@ai-sdk/openai';
import { generateText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
    prompt:
      'Create a program that generates five random numbers between 1 and 100 with two decimal places, and show me the execution results. Also save the result to a file.',
    tools: {
      code_interpreter: openai.tools.codeInterpreter(),
      web_search: openai.tools.webSearch(),
      file_search: openai.tools.fileSearch({ vectorStoreIds: ['vs_1234'] }), // 需要一个已配置的向量存储
    },
  });

  for (const part of result.content) {
    if (part.type === 'source') {
      if (part.sourceType === 'document') {
        const providerMetadata = part.providerMetadata as
          | OpenaiResponsesSourceDocumentProviderMetadata
          | undefined;
        if (!providerMetadata) continue;
        const annotation = providerMetadata.openai;
        switch (annotation.type) {
          case 'file_citation':
            // file_引用从 file_search 返回并提供：
            // 属性：类型、文件 ID 和索引
            // 文件名可以通过part.filename 访问。
            break;
          case 'container_file_citation':
            // container_file_引用从 code_interpreter 返回并提供：
            // 属性：类型、containerId 和 fileId
            // 文件名可以通过part.filename 访问。
            break;
          case 'file_path':
            // file_path 提供：
            // 属性：类型、文件 ID 和索引
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
