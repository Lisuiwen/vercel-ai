import { google } from '@ai-sdk/google';
import { generateText, type ModelMessage } from 'ai';
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

  const turn1 = await generateText({
    model: google.interactions('gemini-2.5-flash'),
    messages,
    reasoning: 'medium',
    providerOptions: {
      google: { store: false, thinkingSummaries: 'auto' },
    },
  });

  console.log('--- Turn 1 ---');
  if (turn1.reasoningText) {
    console.log('\x1b[34m' + turn1.reasoningText + '\x1b[0m');
  }
  console.log(turn1.text);
  console.log();

  messages.push(...turn1.responseMessages);
  messages.push({
    role: 'user',
    content:
      'How long after the New York train departs does the meeting happen?',
  });

  const turn2 = await generateText({
    model: google.interactions('gemini-2.5-flash'),
    messages,
    reasoning: 'medium',
    providerOptions: {
      google: { store: false, thinkingSummaries: 'auto' },
    },
  });

  console.log('--- Turn 2 ---');
  if (turn2.reasoningText) {
    console.log('\x1b[34m' + turn2.reasoningText + '\x1b[0m');
  }
  console.log(turn2.text);
});
