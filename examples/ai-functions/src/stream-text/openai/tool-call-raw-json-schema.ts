import { openai } from '@ai-sdk/openai';
import { jsonSchema, streamText, tool } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  const result = streamText({
    model: openai('gpt-3.5-turbo'),
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
    prompt: 'What is the weather in San Francisco?',
  });

  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'text-delta': {
        console.log('Text:', part.text);
        break;
      }

      case 'tool-call': {
        if (part.dynamic) {
          continue;
        }

        switch (part.toolName) {
          case 'cityAttractions': {
            console.log('TOOL CALL cityAttractions');
            console.log(`city: ${part.input.city}`); // 字符串
            break;
          }

          case 'weather': {
            console.log('TOOL CALL weather');
            console.log(`location: ${part.input.location}`); // 字符串
            break;
          }
        }

        break;
      }

      case 'tool-result': {
        if (part.dynamic) {
          continue;
        }

        switch (part.toolName) {
          // 不可用（无 execute 方法）
          // case 'cityAttractions': {
          //   console.log('TOOL RESULT cityAttractions');
          //   console.log(`city: ${part.input.city}`); // 字符串
          //   console.log(`result: ${part.result}`);
          //   break;
          // }

          case 'weather': {
            console.log('TOOL RESULT weather');
            console.log(`location: ${part.input.location}`); // 字符串
            console.log(`temperature: ${part.output.temperature}`); // 数字
            break;
          }
        }

        break;
      }

      case 'finish': {
        console.log('Finish reason:', part.finishReason);
        console.log('Total Usage:', part.totalUsage);
        break;
      }

      case 'error':
        console.error('Error:', part.error);
        break;
    }
  }
});
