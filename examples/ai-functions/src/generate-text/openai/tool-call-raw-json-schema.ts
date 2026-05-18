import { openai } from '@ai-sdk/openai';
import { generateText, jsonSchema, tool } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: openai('gpt-3.5-turbo'),
    maxOutputTokens: 512,
    tools: {
      weather: tool({
        description: 'Get the weather in a location',
        inputSchema: jsonSchema<{ location: string }>({
          type: 'object',
          properties: {
            location: { type: 'string' },
          },
          required: ['location'],
        }),
        // 下面的位置被推断为一个字符串：
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
      cityAttractions: tool({
        inputSchema: jsonSchema<{ city: string }>({
          type: 'object',
          properties: {
            city: { type: 'string' },
          },
          required: ['city'],
        }),
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
