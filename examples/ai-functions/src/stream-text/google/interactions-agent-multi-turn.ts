import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { cancelOnSigint } from '../../lib/cancel-on-sigint';
import { run } from '../../lib/run';

run(async () => {
  // Ctrl+C 中止正在进行的流，这会触发
  // `POST /interactions/{id}/cancel` on Google's side so the agent stops
  // 计费而不是在后台运行完成。
  const ac = cancelOnSigint();

  // 第 1 回合：要求深度研究代理确定关键主题。默认
  // `store: true` keeps server-side context so we can chain via
  // `previousInteractionId`. Note: agent calls can be slow. With
  // `thinkingSummaries: 'auto'` the agent emits intermediate reasoning
  // 事件的运作方式——在最终答案旁边打印成灰色。
  console.log('--- Turn 1 ---');
  const turn1 = streamText({
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
      'List three foundational concepts behind transformer-based language models (one sentence each).',
    abortSignal: ac.signal,
  });
  for await (const part of turn1.fullStream) {
    if (part.type === 'reasoning-delta') {
      process.stdout.write(`\x1b[2m${part.text}\x1b[0m`);
    } else if (part.type === 'text-delta') {
      process.stdout.write(part.text);
    }
  }
  console.log();

  const interactionId = (await turn1.providerMetadata)?.google?.interactionId as
    | string
    | undefined;
  console.log();
  console.log('Interaction id (turn 1):', interactionId);
  console.log();

  if (interactionId == null) {
    throw new Error('Turn 1 did not return an interaction id.');
  }

  // 第 2 回合：仅发送新用户消息 + previousInteractionId。这
  // 服务器从其自己的状态中提取先前的代理上下文 - 无消息
  // 历史需要重新发送。
  console.log('--- Turn 2 ---');
  const turn2 = streamText({
    model: google.interactions({
      agent: 'deep-research-pro-preview-12-2025',
    }),
    prompt:
      'Of those three, which one was the most novel contribution at the time? Answer in 1-2 sentences.',
    providerOptions: {
      google: {
        previousInteractionId: interactionId,
        agentConfig: {
          type: 'deep-research',
          thinkingSummaries: 'auto',
        },
      },
    },
    abortSignal: ac.signal,
  });
  for await (const part of turn2.fullStream) {
    if (part.type === 'reasoning-delta') {
      process.stdout.write(`\x1b[2m${part.text}\x1b[0m`);
    } else if (part.type === 'text-delta') {
      process.stdout.write(part.text);
    }
  }
  console.log();
  console.log();
  console.log(
    'Interaction id (turn 2):',
    (await turn2.providerMetadata)?.google?.interactionId,
  );
});
