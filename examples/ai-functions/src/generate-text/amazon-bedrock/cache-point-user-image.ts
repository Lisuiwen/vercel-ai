import { amazonBedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';
import fs from 'node:fs';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: amazonBedrock('anthropic.claude-3-5-sonnet-20241022-v2:0'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            mediaType: 'image',
            data: fs.readFileSync('./data/comic-cat.png'),
          },
          {
            type: 'text',
            text: 'What is in this image?',
          },
        ],
        providerOptions: { bedrock: { cachePoint: { type: 'default' } } },
      },
    ],
  });

  console.log(result.text);
  console.log();
  console.log('Token usage:', result.usage);
  // TODO：由于某种原因没有使用缓存令牌
  // https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html
  // 唯一的差异是传递消息字节的一些引入，并且
  // 也许是图像的大小。
  console.log(
    'Cache token usage:',
    result.finalStep.providerMetadata?.bedrock?.usage,
  );
  console.log('Finish reason:', result.finishReason);
  console.log('Response headers:', result.response.headers);
});
