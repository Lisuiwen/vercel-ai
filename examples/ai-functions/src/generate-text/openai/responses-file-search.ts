import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { run } from '../../lib/run';

/**
 * 准备
 * 请创建矢量存储并将文件放入您的矢量中。
 * URL：openai矢量商店仪表板
 * https://platform.openai.com/storage/vector_stores/
 */

const VectorStoreId = 'vs_xxxxxxxxxxxxxxxxxxxxxxxx'; // 输入您的矢量商店 ID。

run(async () => {
  // 基本文本生成
  const basicResult = await generateText({
    model: openai.responses('gpt-4.1-mini'),
    prompt: 'What is quantum computing?', // 请询问您的文件。
    tools: {
      file_search: openai.tools.fileSearch({
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
  console.dir(basicResult.toolCalls, { depth: null });
  console.dir(basicResult.toolResults, { depth: null });
});
