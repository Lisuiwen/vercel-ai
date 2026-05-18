import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { cancelOnSigint } from '../../lib/cancel-on-sigint';
import { run } from '../../lib/run';

run(async () => {
  // Ctrl+C aborts the stream, which fires `POST /interactions/{id}/cancel`
  // 在 Google 这边，代理会停止计费而不是跑去
  // 在后台完成。
  const ac = cancelOnSigint();

  // 深度研究代理在
  // 服务器。预计此呼叫需要一段时间（通常是一分钟或更长时间）。和
  // `thinkingSummaries: 'auto'` the agent emits intermediate reasoning
  // 事件的运作方式——在最终答案旁边打印成灰色。
  const result = streamText({
    model: google.interactions({
      agent: 'deep-research-pro-preview-12-2025',
    }),
    providerOptions: {
      google: {
        agentConfig: {
          type: 'deep-research',
          thinkingSummaries: 'auto',
        },
      },
    },
    prompt:
      'Briefly summarize the most-cited papers on retrieval-augmented generation since 2024 (2-3 sentences).',
    abortSignal: ac.signal,
  });

  for await (const part of result.fullStream) {
    if (part.type === 'reasoning-delta') {
      process.stdout.write(`\x1b[2m${part.text}\x1b[0m`);
    } else if (part.type === 'text-delta') {
      process.stdout.write(part.text);
    }
  }
  console.log();

  console.log();
  console.log('Token usage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
  console.log(
    'Interaction id:',
    (await result.finalStep).providerMetadata?.google?.interactionId,
  );
});
