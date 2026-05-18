import { azure } from '@ai-sdk/azure';
import { generateImage } from 'ai';
import { presentImages } from '../../lib/present-image';
import { run } from '../../lib/run';

run(async () => {
  const { image } = await generateImage({
    model: azure.imageModel('gpt-image-1'), // 使用您自己的部署
    prompt: 'Santa Claus driving a Cadillac',
  });

  await presentImages([image]);
});
