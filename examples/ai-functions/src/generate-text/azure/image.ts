import { azure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import fs from 'node:fs';
import { run } from '../../lib/run';

run(async () => {
  const imageData = fs.readFileSync('data/comic-cat.png');
  const imageBase64_string = imageData.toString('base64');

  const { text, usage } = await generateText({
    model: azure('gpt-4.1-mini'), // 使用您自己的部署
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe the image in detail.' },
          {
            type: 'file',
            mediaType: 'image',
            // 在内部，MIME 类型会自动检测：
            data: imageBase64_string,
            providerOptions: {
              // When using the Azure OpenAI provider, the imageDetail option can be configured under the `openai` key:
              azure: {
                imageDetail: 'low',
              },
            },
          },
        ],
      },
    ],
  });

  console.log(text);
  console.log();
  console.log('Usage:', usage);
});
