import { openai } from '@ai-sdk/openai';
import { generateImage } from 'ai';
import { presentImages } from '../../lib/present-image';
import { run } from '../../lib/run';

run(async () => {
  const { images } = await generateImage({
    model: openai.image('dall-e-3'),
    n: 3, // 3 次通话； dall-e-3 一次只能生成 1 张图像
    prompt: 'Santa Claus driving a Cadillac',
  });

  await presentImages(images);
});
