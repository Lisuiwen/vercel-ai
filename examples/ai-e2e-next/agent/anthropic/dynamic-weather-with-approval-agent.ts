import { anthropic } from '@ai-sdk/anthropic';
import {
  ToolLoopAgent,
  dynamicTool,
  type InferAgentUIMessage,
  type ToolSet,
} from 'ai';
import { z } from 'zod';

function randomWeather() {
  const weatherOptions = ['sunny', 'cloudy', 'rainy', 'windy'];
  return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
}

const weatherTool = dynamicTool({
  description: 'Get the weather in a location',
  inputSchema: z.object({ city: z.string() }),
  needsApproval: true,
  async *execute() {
    yield { state: 'loading' as const };

    // 人为增加 2 秒延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    yield {
      state: 'ready' as const,
      temperature: 72,
      weather: randomWeather(),
    };
  },
});

// 类型为泛型 ToolSet（开发时未知 tools）
const tools: {} = { weather: weatherTool } satisfies ToolSet;

export const dynamicWeatherWithApprovalAgent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  // 需要上下文工程以确保模型不会重试
  // 若未获批准，则阻止 tool 执行：
  instructions:
    'When a tool execution is not approved by the user, do not retry it.' +
    'Just say that the tool execution was not approved.',
  tools,
  onStepFinish: ({ request }) => {
    console.log(JSON.stringify(request.body, null, 2));
  },
});

export type DynamicWeatherWithApprovalAgentUIMessage = InferAgentUIMessage<
  typeof dynamicWeatherWithApprovalAgent
>;
