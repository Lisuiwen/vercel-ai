import { klingai, type KlingAIVideoModelOptions } from '@ai-sdk/klingai';
import { experimental_generateVideo as generateVideo } from 'ai';
import { presentVideos } from '../../lib/present-video';
import { run } from '../../lib/run';
import { withSpinner } from '../../lib/spinner';

run(async () => {
  const { videos } = await withSpinner(
    'Generating KlingAI v3.0 motion control video with element reference...',
    () =>
      generateVideo({
        model: klingai.video('kling-v3.0-motion-control'),
        prompt: {
          image:
            'https://raw.githubusercontent.com/vercel/ai/refs/heads/main/examples/ai-functions/data/comic-cat.png',
          text: 'The cat waves hello and smiles',
        },
        providerOptions: {
          klingai: {
            // 必需：参考动态视频的 URL
            videoUrl: 'https://example.com/reference-motion.mp4',
            // 必需：是否匹配图像或视频的方向
            characterOrientation: 'image',
            // Required: 'std' (standard) or 'pro' (professional)
            mode: 'std',
            // 可选：元素库中的参考元素（v3.0+，最多 1）
            elementList: [{ element_id: 829836802793406551 }],
          } satisfies KlingAIVideoModelOptions,
        },
      }),
  );

  await presentVideos(videos);
});
