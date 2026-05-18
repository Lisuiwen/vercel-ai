import { klingai, type KlingAIVideoModelOptions } from '@ai-sdk/klingai';
import { experimental_generateVideo as generateVideo } from 'ai';
import { presentVideos } from '../../lib/present-video';
import { run } from '../../lib/run';
import { withSpinner } from '../../lib/spinner';

run(async () => {
  const { videos, providerMetadata } = await withSpinner(
    'Generating KlingAI motion control video (pro mode)...',
    () =>
      generateVideo({
        model: klingai.video('kling-v2.6-motion-control'),
        prompt: {
          image:
            'https://raw.githubusercontent.com/vercel/ai/refs/heads/main/examples/ai-functions/data/comic-cat.png',
          text: 'The character performs a smooth dance move',
        },
        providerOptions: {
          klingai: {
            // 必需：参考动态视频的 URL
            videoUrl: 'https://example.com/dance-reference.mp4',
            // 匹配参考视频的方向（最多允许 30 秒）
            characterOrientation: 'video',
            // 专业模式：更高质量的输出
            mode: 'pro',
            // 保留参考视频中的原始音频
            keepOriginalSound: 'yes',
            // 启用水印
            watermarkEnabled: true,
            // 自定义轮询设置
            pollIntervalMs: 10000, // 10秒
            pollTimeoutMs: 600000, // 10 分钟（专业模式需要更长的时间）
          } satisfies KlingAIVideoModelOptions,
        },
      }),
  );

  console.log('Provider metadata:', JSON.stringify(providerMetadata, null, 2));
  await presentVideos(videos);
});
