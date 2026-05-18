import { google } from '@ai-sdk/google';
import { streamText, type ModelMessage } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  /*
   * Stateless multi-turn with reasoning enabled. Because we pass `store: false`
   * 并每轮重新发送完整的消息历史记录，助手的先前信息
   * reasoning blocks — including their `thoughtSignature` — must round-trip
   * 在第 2 轮逐字返回 API。如果签名丢失或损坏
   * 服务器拒绝请求，因此成功的后续操作确认
   * 认为签名被正确保存。
   */
  const messages: Array<ModelMessage> = [
    {
      role: 'user',
      content:
        'A train leaves Boston at 8:00 AM travelling at 60 mph. Another ' +
        'train leaves New York (215 miles away) at 9:00 AM travelling at ' +
        '75 mph toward Boston. Where do they meet?',
    },
  ];

  console.log('--- Turn 1 ---');
  const turn1 = streamText({
    model: google.interactions('gemini-2.5-flash'),
    messages,
    reasoning: 'medium',
    providerOptions: {
      google: { store: false, thinkingSummaries: 'auto' },
    },
  });
  for await (const part of turn1.fullStream) {
    if (part.type === 'reasoning-delta') {
      process.stdout.write('\x1b[34m' + part.text + '\x1b[0m');
    } else if (part.type === 'text-delta') {
      process.stdout.write(part.text);
    }
  }
  console.log();
  console.log();

  messages.push(...(await turn1.response).messages);
  messages.push({
    role: 'user',
    content:
      'How long after the New York train departs does the meeting happen?',
  });

  console.log('--- Turn 2 ---');
  const turn2 = streamText({
    model: google.interactions('gemini-2.5-flash'),
    messages,
    reasoning: 'medium',
    providerOptions: {
      google: { store: false, thinkingSummaries: 'auto' },
    },
  });
  for await (const part of turn2.fullStream) {
    if (part.type === 'reasoning-delta') {
      process.stdout.write('\x1b[34m' + part.text + '\x1b[0m');
    } else if (part.type === 'text-delta') {
      process.stdout.write(part.text);
    }
  }
  console.log();
});
