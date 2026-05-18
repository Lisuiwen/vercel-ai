import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  // Turn 1: ask about Spanish cities. The default `store: true` makes the
  // server keep the prior context so we can chain via `previousInteractionId`.
  console.log('--- Turn 1 ---');
  const turn1 = streamText({
    model: google.interactions('gemini-2.5-flash'),
    prompt: 'What are the three largest cities in Spain?',
  });
  for await (const textPart of turn1.textStream) {
    process.stdout.write(textPart);
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

  // 第 2 回合：仅发送新用户消息 + previousInteractionId。服务器
  // 从它自己的状态中提取先前的上下文 - 不需要消息历史记录
  // 电线。
  console.log('--- Turn 2 ---');
  const turn2 = streamText({
    model: google.interactions('gemini-2.5-flash'),
    prompt: 'What is the most famous landmark in the second one?',
    providerOptions: {
      google: { previousInteractionId: interactionId },
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
