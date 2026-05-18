import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { run } from '../../lib/run';

/**
 * Demonstrates `namespace` propagation on dispatched function calls.
 * 服务器执行的 tool_search 让 OpenAI 可以跨延迟工具进行搜索
 * and dispatch one - the resulting function_call carries `namespace`
 * 确定模型选择了哪个延迟工具。表面通过
 * `providerMetadata.openai.namespace` on the tool-call content part.
 *
 * https://developers.openai.com/api/docs/guides/function-calling#defining-namespaces
 */
run(async () => {
  const result = streamText({
    model: openai.responses('gpt-5.4'),
    prompt: 'What is the current weather in Tokyo?',
    tools: {
      tool_search: openai.tools.toolSearch({ execution: 'server' }),
      get_weather: tool({
        description: 'Get the current weather at a specific location',
        inputSchema: z.object({
          location: z.string(),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 64,
          condition: 'Partly cloudy',
        }),
        providerOptions: {
          openai: { deferLoading: true },
        },
      }),
    },
  });

  for await (const part of result.fullStream) {
    if (part.type === 'tool-input-end') {
      console.log(
        `tool-input-end providerMetadata.openai: ${JSON.stringify(part.providerMetadata?.openai)}`,
      );
    } else if (part.type === 'tool-call') {
      console.log(`tool-call ${part.toolName}:`);
      console.log(`  input: ${JSON.stringify(part.input)}`);
      console.log(
        `  providerMetadata.openai: ${JSON.stringify(part.providerMetadata?.openai)}`,
      );
    }
  }
});
