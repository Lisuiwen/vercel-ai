import { azure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import { run } from '../../lib/run';

/**
 * 准备1
 * 请在 .env 文件中添加参数以初始化 Azure OpenAI。
 * AZURE_RESOURCE_NAME="<your_resource_name>"
 * AZURE_API_KEY="<your_api_key>"
 *
 * 准备2
 * 请创建矢量存储并将文件放入您的矢量中。
 * 网址：AOAI矢量商店门户
 * https://oai.azure.com/resource/vectorstore
 */

const VectorStoreId = 'vs_xxxxxxxxxxxxxxxxxxxxxxxx'; // 输入您的矢量商店 ID。

run(async () => {
  // 基本文本生成
  const basicResult = await generateText({
    model: azure.responses('gpt-4.1-mini'),
    prompt: 'What is quantum computing?', // 请询问您的文件。
    tools: {
      file_search: azure.tools.fileSearch({
        // 可选配置：
        vectorStoreIds: [VectorStoreId],
        maxNumResults: 10,
        ranking: {
          ranker: 'auto',
        },
      }),
    },
    // 强制文件搜索工具：
    toolChoice: { type: 'tool', toolName: 'file_search' },
  });

  console.log('\n=== Basic Text Generation ===');
  console.log(basicResult.text);
  console.log('\n=== Other Outputs ===');
  console.dir(basicResult.toolCalls, { depth: Infinity });
  console.dir(basicResult.toolResults, { depth: Infinity });
});
