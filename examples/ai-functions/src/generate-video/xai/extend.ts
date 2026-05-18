import { xai, type XaiVideoModelOptions } from '@ai-sdk/xai';
import { experimental_generateVideo as generateVideo } from 'ai';
import { presentVideos } from '../../lib/present-video';
import { run } from '../../lib/run';
import { withSpinner } from '../../lib/spinner';

// 视频扩展：从最后一帧继续现有视频。
// The `duration` controls the length of the *extension* only, not the total.
// `aspectRatio` and `resolution` are not supported in extension mode — the
// 输出继承输入视频的输出。
run(async () => {
  // 第 1 步：生成短源视频。
  const source = await withSpinner('Step 1: Generating source video...', () =>
    generateVideo({
      model: xai.video('grok-imagine-video'),
      prompt: 'A cat sitting on a sunlit windowsill, tail gently swishing.',
      duration: 5,
      aspectRatio: '16:9',
      providerOptions: {
        xai: { pollTimeoutMs: 600000 } satisfies XaiVideoModelOptions,
      },
    }),
  );

  const sourceUrl = source.providerMetadata?.xai?.videoUrl as
    | string
    | undefined;
  if (sourceUrl == null) {
    throw new Error('xAI provider metadata did not include a source videoUrl.');
  }

  console.log('Source video URL:', sourceUrl);
  await presentVideos(source.videos);

  // 步骤 2：用新场景扩展视频。
  const extended = await withSpinner(
    'Step 2: Extending video with a new scene...',
    () =>
      generateVideo({
        model: xai.video('grok-imagine-video'),
        prompt:
          'The cat slowly turns its head, notices a butterfly, and leaps off the windowsill.',
        duration: 6,
        providerOptions: {
          xai: {
            mode: 'extend-video',
            videoUrl: sourceUrl,
            pollTimeoutMs: 600000,
          } satisfies XaiVideoModelOptions,
        },
      }),
  );

  console.log('\nExtended video (original 5s + 6s extension = 11s total):');
  console.log(
    'Provider metadata:',
    JSON.stringify(extended.providerMetadata, null, 2),
  );
  await presentVideos(extended.videos);
});
