import {
  azure,
  type AzureResponsesSourceDocumentProviderMetadata,
  type AzureResponsesTextProviderMetadata,
} from '@ai-sdk/azure';
import { streamText } from 'ai';
import { run } from '../../lib/run';
import { downloadAzureContainerFile } from '../../lib/download-azure-container-file';

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
    prompt:
      'Create a program that generates five random numbers between 1 and 100 with two decimal places, and show me the execution results. Also save the result to a file.',
    tools: {
      code_interpreter: azure.tools.codeInterpreter(),
    },
  });

  console.log('\n=== Basic Text Generation ===');
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
  console.log('\n=== Other Outputs ===');
  console.log(await result.toolCalls);
  console.log(await result.toolResults);
  console.log('\n=== Code Interpreter Annotations ===');

  const containerfileList: {
    containerId: string;
    fileId: string;
  }[] = [];
  for await (const part of result.fullStream) {
    if (part.type === 'text-end') {
      const providerMetadata = part.providerMetadata as
        | AzureResponsesTextProviderMetadata
        | undefined;
      if (!providerMetadata) continue;
      const { azure } = providerMetadata;
      console.log('-- text-part-- ');
      console.dir({ azure }, { depth: Infinity });
    } else if (part.type === 'source') {
      if (part.sourceType === 'document') {
        const providerMetadata = part.providerMetadata as
          | AzureResponsesSourceDocumentProviderMetadata
          | undefined;
        if (!providerMetadata) continue;
        const { azure } = providerMetadata;
        console.log('-- source-document-part-- ');
        console.dir({ azure }, { depth: Infinity });
        if (azure.type === 'container_file_citation') {
          containerfileList.push({
            containerId: azure.containerId,
            fileId: azure.fileId,
          });
        }
      }
    }
  }
  for await (const containerFile of containerfileList) {
    await downloadAzureContainerFile(
      containerFile.containerId,
      containerFile.fileId,
    );
  }
});
