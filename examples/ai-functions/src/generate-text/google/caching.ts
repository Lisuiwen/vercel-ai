import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import fs from 'node:fs';
import { run } from '../../lib/run';

const errorMessage = fs.readFileSync('data/error-message.txt', 'utf8');

run(async () => {
  const result1 = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: errorMessage,
  });

  console.log(result1.text);
  console.log(result1.finalStep.providerMetadata?.google);
  // 例如
  // {
  //   接地元数据：空，
  //   安全评级：空，
  //   使用元数据：{
  //     想法令牌计数：634，
  //     提示令牌计数：2152，
  //     候选人令牌计数：694，
  //     总令牌数：3480
  //   }
  // }

  const result2 = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: errorMessage,
  });

  console.log(result2.text);
  console.log(result2.finalStep.providerMetadata?.google);

  // 例如
  // {
  //   接地元数据：空，
  //   安全评级：空，
  //   使用元数据：{
  //     缓存内容令牌计数：2027，
  //     想法令牌计数：702，
  //     提示令牌计数：2152，
  //     候选人令牌计数：710，
  //     总令牌数：3564
  //   }
  // }
});
