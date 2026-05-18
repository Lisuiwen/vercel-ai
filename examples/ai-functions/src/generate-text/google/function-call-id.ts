import { google } from '@ai-sdk/google';
import { generateText, isStepCount, type ModelMessage } from 'ai';
import { weatherTool } from '../../tools/weather-tool';
import { run } from '../../lib/run';

/*
 * 练习 Gemini 3 的两轮并行函数调用。双子座3
 * emits an `id` on each `functionCall` part. The matching `functionResponse`
 * parts we send back in turn 2 should carry the same `id` so the model can
 * 将每个响应与其调用相关联。如果我们删除任一侧的 id，
 * API 可能会拒绝请求，或者模型可能会错误关联并行调用。
 */
run(async () => {
  const messages: Array<ModelMessage> = [
    {
      role: 'user',
      content:
        'In parallel, get the weather for San Francisco, London, and Tokyo. ' +
        'Call the weather tool three times, one per city.',
    },
  ];

  // 第 1 回合：模型发出并行工具调用；工具自动执行。
  const turn1 = await generateText({
    model: google('gemini-3-flash-preview'),
    tools: { weather: weatherTool },
    messages,
    stopWhen: isStepCount(1),
  });

  console.log('Turn 1 tool call IDs:');
  for (const call of turn1.toolCalls) {
    console.log(`  - ${call.toolCallId} (${call.toolName})`);
  }

  messages.push(...turn1.finalStep.response.messages);
  messages.push({
    role: 'user',
    content:
      'Now summarize those three results in a single sentence, sorted from ' +
      'coldest to warmest.',
  });

  // 第 2 回合：将并行工具结果发回。 Gemini 3 需要 ids
  // 它依次发出 1 到相应函数上的往返响应
  // 部分。如果提供商不通过该 ID，此轮转就会失败。
  const turn2 = await generateText({
    model: google('gemini-3-flash-preview'),
    tools: { weather: weatherTool },
    messages,
  });

  console.log('\nTurn 2 text:', turn2.text);
});
