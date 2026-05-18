import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { cancelOnSigint } from '../../lib/cancel-on-sigint';
import { run } from '../../lib/run';

run(async () => {
  // Ctrl+C aborts the call, which fires `POST /interactions/{id}/cancel` on
  // Google 方面因此代理停止计费而不是跑去
  // 在后台完成。
  const ac = cancelOnSigint();

  // 深度研究代理在
  // 服务器。预计此呼叫需要一段时间（通常是一分钟或更长时间）。
  const result = await generateText({
    model: google.interactions({
      agent: 'deep-research-pro-preview-12-2025',
    }),
    prompt:
      'Briefly summarize the most-cited papers on retrieval-augmented generation since 2024 (2-3 sentences).',
    abortSignal: ac.signal,
  });

  console.log(result.text);
  console.log();
  console.log('Token usage:', result.usage);
  console.log('Finish reason:', result.finishReason);
  console.log(
    'Interaction id:',
    result.finalStep.providerMetadata?.google?.interactionId,
  );
});
