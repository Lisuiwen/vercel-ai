import { openai } from '@ai-sdk/openai';
import { generateText, NoSuchToolError, Output, tool } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import { z } from 'zod';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateText({
    model: new MockLanguageModelV3({
      doGenerate: async () => ({
        warnings: [],
        usage: {
          inputTokens: {
            total: 10,
            noCache: 10,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: {
            total: 20,
            text: 20,
            reasoning: undefined,
          },
        },
        finishReason: { raw: undefined, unified: 'tool-calls' },
        content: [
          {
            type: 'tool-call',
            toolCallType: 'function',
            toolCallId: 'call-1',
            toolName: 'cityAttractions',
            // 错误的工具调用参数（城市与城市）：
            input: `{ "city": "San Francisco" }`,
          },
        ],
      }),
    }),
    tools: {
      cityAttractions: tool({
        inputSchema: z.object({ cities: z.array(z.string()) }),
      }),
    },
    prompt: 'What are the tourist attractions in San Francisco?',

    experimental_repairToolCall: async ({
      toolCall,
      tools,
      inputSchema,
      error,
    }) => {
      if (NoSuchToolError.isInstance(error)) {
        return null; // 不要尝试修复无效的工具名称
      }

      const tool = tools[toolCall.toolName as keyof typeof tools];

      // 示例方法：使用具有结构化输出的模型进行修复：
      const { output: repairedArgs } = await generateText({
        model: openai('gpt-4o'),
        output: Output.object({ schema: tool.inputSchema }),
        prompt: [
          `The model tried to call the tool "${
            toolCall.toolName
          }" with the following arguments: ${JSON.stringify(toolCall.input)}.`,
          `The tool accepts the following schema: ${JSON.stringify(
            inputSchema(toolCall),
          )}.`,
          'Please try to fix the arguments.',
        ].join('\n'),
      });

      return { ...toolCall, input: JSON.stringify(repairedArgs) };
    },
  });

  console.log('Repaired tool calls:');
  console.log(JSON.stringify(result.toolCalls, null, 2));
});
