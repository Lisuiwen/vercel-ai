import { google } from '@ai-sdk/google';
import { streamText, type ModelMessage } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  // Stateless multi-turn: pass `store: false` and re-send the full conversation
  // 历史每一个转折点。谷歌方面没有任何保留；线体
  // contains the entire history and `store: false`, with no
  // `previous_interaction_id`.
  const messages: Array<ModelMessage> = [
    {
      role: 'user',
      content: 'What are the three largest cities in Spain?',
    },
  ];

  console.log('--- Turn 1 ---');
  const turn1 = streamText({
    model: google.interactions('gemini-2.5-flash'),
    messages,
    providerOptions: {
      google: { store: false },
    },
  });
  for await (const textPart of turn1.textStream) {
    process.stdout.write(textPart);
  }
  console.log();
  console.log();
  console.log(
    'Interaction id (turn 1):',
    (await turn1.providerMetadata)?.google?.interactionId,
  );
  console.log();

  // 将第 1 回合的助理回合追加到本地消息历史记录中，然后
  // send a follow-up that depends on turn 1's context. With `store: false`, the
  // 服务器没有先前的状态可供依赖——模型必须重建
  // 我们重新发送的消息中的上下文。
  messages.push(...(await turn1.response).messages);
  messages.push({
    role: 'user',
    content: 'What is the most famous landmark in the second one?',
  });

  console.log('--- Turn 2 ---');
  const turn2 = streamText({
    model: google.interactions('gemini-2.5-flash'),
    messages,
    providerOptions: {
      google: { store: false },
    },
  });
  for await (const textPart of turn2.textStream) {
    process.stdout.write(textPart);
  }
  console.log();
  console.log();
  console.log(
    'Interaction id (turn 2):',
    (await turn2.providerMetadata)?.google?.interactionId,
  );
});
