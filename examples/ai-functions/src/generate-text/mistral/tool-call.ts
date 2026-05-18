import { mistral } from '@ai-sdk/mistral';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { weatherTool } from '../../tools/weather-tool';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: mistral('mistral-large-latest'),
    maxOutputTokens: 512,
    tools: {
      weather: weatherTool,
      cityAttractions: tool({
        inputSchema: z.object({ city: z.string() }),
      }),
    },
    prompt:
      'What is the weather in San Francisco and what attractions should I visit?',
  });

  // 键入工具调用：
  for (const toolCall of result.toolCalls) {
    if (toolCall.dynamic) {
      continue;
    }

    switch (toolCall.toolName) {
      case 'cityAttractions': {
        toolCall.input.city; // 字符串
        break;
      }

      case 'weather': {
        toolCall.input.location; // 字符串
        break;
      }
    }
  }

  // 具有执行方法的工具的类型化工具结果：
  for (const toolResult of result.toolResults) {
    if (toolResult.dynamic) {
      continue;
    }

    switch (toolResult.toolName) {
      // 不可用（无 execute 方法）
      // case 'cityAttractions': {
      //   toolResult.input.city; // 字符串
      //   工具结果.结果；
      //   break;
      // }

      case 'weather': {
        toolResult.input.location; // 字符串
        toolResult.output.location; // 字符串
        toolResult.output.temperature; // 数字
        break;
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
});
