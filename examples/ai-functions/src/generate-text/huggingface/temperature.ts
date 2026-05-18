import { huggingFace } from '@ai-sdk/huggingface';
import { generateText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  console.log('Low temperature (0.1) - More focused:');
  const lowTemp = await generateText({
    model: huggingFace('meta-llama/Llama-3.1-8B-Instruct'),
    prompt: 'Write a creative story about a robot learning to paint.',
    temperature: 0.1,
  });
  console.log(lowTemp.text);
  console.log();
  console.log('Low temp usage:', lowTemp.usage);

  // TODO：目前因网关超时而失败@dancer
  // console.log('High temperature (1.5) - More creative:');
  // const highTemp = 等待生成文本({
  //   model: huggingface('meta-llama/Llama-3.1-8B-Instruct'),
  //   prompt: 'Write a creative story about a robot learning to paint.',
  //   温度：1.5，
  // });
  // console.log(highTemp.text);
  // 控制台.log();

  // console.log('Usage comparison:');
  // console.log('High temp usage:', highTemp.usage);
});
