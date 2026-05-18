import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import fs from 'node:fs';
import { run } from '../../lib/run';

const errorMessage = fs.readFileSync('data/error-message.txt', 'utf8');

run(async () => {
  const result1 = streamText({
    model: google('gemini-2.5-flash'),
    prompt: errorMessage,
  });

  await result1.consumeStream();

  const providerMetadata1 = await result1.providerMetadata;
  console.log(providerMetadata1?.google);

  // 例如
  // {
  //   接地元数据：空，
  //   安全评级：空，
  //   使用元数据：{
  //     想法令牌计数：1336，
  //     提示令牌计数：2152，
  //     候选人令牌计数：992，
  //     总令牌数：4480
  //   }
  // }

  const result2 = streamText({
    model: google('gemini-2.5-flash'),
    prompt: errorMessage,
  });

  await result2.consumeStream();

  const providerMetadata2 = await result2.providerMetadata;
  console.log(providerMetadata2?.google);

  // 例如
  // {
  //   接地元数据：空，
  //   安全评级：空，
  //   使用元数据：{
  //     缓存内容令牌计数：2027，
  //     想法令牌计数：908，
  //     提示令牌计数：2152，
  //     候选人令牌计数：667，
  //     总令牌数：3727
  //   }
  // }
});
