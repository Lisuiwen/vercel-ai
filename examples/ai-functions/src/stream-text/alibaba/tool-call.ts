import { alibaba } from '@ai-sdk/alibaba';
import { isStepCount, streamText, tool } from 'ai';
import { z } from 'zod';
import { run } from '../../lib/run';

run(async () => {
  const result = streamText({
    model: alibaba('qwen-plus'),
    prompt: 'What is the weather in Paris and Tokyo?',
    stopWhen: isStepCount(5), // 允许多轮：调用工具→获取结果→生成答案
    tools: {
      getWeather: tool({
        description: 'Get the weather for a location',
        inputSchema: z.object({
          location: z.string().describe('The location to get weather for'),
        }),
        execute: async ({ location }) => {
          // 模拟天气 API 调用
          const temps = { Paris: 18, Tokyo: 24, London: 15 };
          const temp = temps[location as keyof typeof temps] ?? 20;
          return {
            location,
            temperature: temp,
            unit: 'celsius',
            condition: 'sunny',
          };
        },
      }),
    },
  });

  // 在发生时显示工具调用和文本
  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'tool-call':
        console.log(`\nTool call: ${part.toolName}`);
        console.log(`   Input: ${JSON.stringify(part.input)}`);
        break;
      case 'tool-result':
        console.log(`   Result: ${JSON.stringify(part.output)}`);
        break;
      case 'text-delta':
        process.stdout.write(part.text);
        break;
    }
  }

  console.log('\n\nUsage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
  console.log('Steps:', (await result.steps).length);
});
