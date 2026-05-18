import { google } from '@ai-sdk/google';
import { isStepCount, streamText, type ModelMessage } from 'ai';
import { weatherTool } from '../../tools/weather-tool';
import { run } from '../../lib/run';

/*
 * 通过以下方式练习 Gemini 3 的两轮并行函数调用
 * streaming. Gemini 3 emits an `id` on each `functionCall` part. The matching
 * `functionResponse` parts we send back in turn 2 should carry the same `id`
 * 因此模型可以将每个响应与其调用相关联。如果我们把 id 放在
 * 无论哪一方，API 都可能拒绝请求，或者模型可能会错误关联
 * 并行调用。
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
  const turn1 = streamText({
    model: google('gemini-3-flash-preview'),
    tools: { weather: weatherTool },
    messages,
    stopWhen: isStepCount(1),
  });

  for await (const part of turn1.fullStream) {
    if (part.type === 'tool-call') {
      console.log(
        `Turn 1 tool call (${part.toolCallId}): ${part.toolName}`,
        JSON.stringify(part.input),
      );
    } else if (part.type === 'tool-result') {
      console.log(
        `Turn 1 tool result (${part.toolCallId}):`,
        JSON.stringify(part.output),
      );
    }
  }

  messages.push(...(await turn1.finalStep).response.messages);
  messages.push({
    role: 'user',
    content:
      'Now summarize those three results in a single sentence, sorted from ' +
      'coldest to warmest.',
  });

  // 第 2 回合：将并行工具结果发回。 Gemini 3 需要 ids
  // 它依次发出 1 到相应函数上的往返响应
  // 部分。如果提供商不通过该 ID，此轮转就会失败。
  const turn2 = streamText({
    model: google('gemini-3-flash-preview'),
    tools: { weather: weatherTool },
    messages,
  });

  console.log('\nTurn 2 text:');
  for await (const part of turn2.fullStream) {
    if (part.type === 'text-delta') {
      process.stdout.write(part.text);
    }
  }
  console.log();
});
