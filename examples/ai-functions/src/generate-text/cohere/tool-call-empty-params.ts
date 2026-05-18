import { cohere } from '@ai-sdk/cohere';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: cohere('command-r-plus'),
    tools: {
      currentTime: tool({
        description: 'Get the current time',
        inputSchema: z.object({}),
        execute: async () => ({
          currentTime: new Date().toLocaleTimeString(),
        }),
      }),
    },
    prompt: 'What is the current time?',
  });

  // 键入工具调用：
  for (const toolCall of result.toolCalls) {
    switch (toolCall.toolName) {
      case 'currentTime': {
        toolCall.input; // {}
        break;
      }
    }
  }

  // 具有执行方法的工具的类型化工具结果：
  for (const toolResult of result.toolResults) {
    switch (toolResult.toolName) {
      case 'currentTime': {
        toolResult.input; // {}
        break;
      }
    }
  }

  console.log(result.text);
  console.log(JSON.stringify(result.toolCalls, null, 2));
  console.log(JSON.stringify(result.toolResults, null, 2));
});
