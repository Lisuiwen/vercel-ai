import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { weatherTool } from '../../tools/weather-tool';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: openai('gpt-3.5-turbo'),
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
      case 'cityAttractions': {
        toolResult.input.city; // 字符串
        toolResult.output; // 任何，因为没有提供outputSchema
        break;
      }

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
