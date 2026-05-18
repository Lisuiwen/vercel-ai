import { readFileSync } from 'node:fs';
import { replicate, type ReplicateImageModelOptions } from '@ai-sdk/replicate';
import { generateImage } from 'ai';
import { presentImages } from '../../lib/present-image';
import { run } from '../../lib/run';

run(async () => {
  // 使用 Flux-fill-pro 模型的修复示例
  // 注意：Flux-2 型号（flux-2-pro、flux-2-dev）不支持掩码。
  // 使用 Flux-fill-pro 或 Flux-fill-dev 进行遮罩修复。
  const image = readFileSync('data/sunlit_lounge.png');
  const mask = readFileSync('data/sunlit_lounge_mask_black_white.png');

  console.log('INPUT IMAGE:');
  await presentImages([
    {
      uint8Array: new Uint8Array(image),
      base64: '',
      mediaType: 'image/png',
    },
  ]);

  const prompt =
    'A sunlit indoor lounge area with a pool containing a flamingo';
  console.log(`PROMPT: ${prompt}`);

  const { images } = await generateImage({
    model: replicate.image('black-forest-labs/flux-fill-pro'),
    prompt: {
      text: prompt,
      images: [image],
      mask,
    },
    providerOptions: {
      replicate: {
        guidance_scale: 7.5,
        num_inference_steps: 30,
      } satisfies ReplicateImageModelOptions,
    },
  });

  console.log('OUTPUT IMAGE:');
  await presentImages(images);
});
