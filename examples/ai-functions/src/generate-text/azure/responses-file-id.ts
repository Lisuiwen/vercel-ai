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
 * 请将文件放入您的数据文件存储中。
 * URL：AOAI数据文件存储门户
 * https://oai.azure.com/resource/datafile
 */

const fileId = 'assistant-xxxxxxxxxxxxxxxxxxxxxx'; // 输入您的矢量商店 ID。

run(async () => {
  const result = await generateText({
    model: azure.responses('gpt-4.1-mini'), // 请询问您的文件。
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Plese give me the short summary in the document.',
          },
          {
            type: 'file',
            data: fileId,
            mediaType: 'application/pdf',
            // filename: 'ai.pdf',
          },
        ],
      },
    ],
  });

  console.log(result.text);
});
