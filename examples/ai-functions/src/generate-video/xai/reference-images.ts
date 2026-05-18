import { xai, type XaiVideoModelOptions } from '@ai-sdk/xai';
import { experimental_generateVideo as generateVideo } from 'ai';
import { presentVideos } from '../../lib/present-video';
import { run } from '../../lib/run';
import { withSpinner } from '../../lib/spinner';

// 视频参考 (R2V)：提供参考图像来指导视频的
// 风格和内容。该模型融合了这些视觉元素
// 图像而不将它们用作第一帧（与图像到视频不同）。
// 每个参考图像可以是公共 HTTPS URL 或 base64 数据 URI。
run(async () => {
  const { video } = await withSpinner(
    'Generating xAI reference-to-video with grok-imagine-video...',
    () =>
      generateVideo({
        model: xai.video('grok-imagine-video'),
        prompt:
          'The comic cat from <IMAGE_1> and the comic dog from <IMAGE_2> ' +
          'are having a playful chase through a sunlit park. ' +
          'Cinematic slow-motion, warm afternoon light.',
        duration: 8,
        aspectRatio: '16:9',
        providerOptions: {
          xai: {
            mode: 'reference-to-video',
            referenceImageUrls: [
              'https://raw.githubusercontent.com/vercel/ai/refs/heads/main/examples/ai-functions/data/comic-cat.png',
              'https://raw.githubusercontent.com/vercel/ai/refs/heads/main/examples/ai-functions/data/comic-dog.png',
            ],
            pollTimeoutMs: 600000, // 10分钟
          } satisfies XaiVideoModelOptions,
        },
      }),
  );

  await presentVideos([video]);
});
