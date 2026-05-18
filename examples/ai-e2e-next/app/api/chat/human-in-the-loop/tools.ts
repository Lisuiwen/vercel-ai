import { tool, type ToolSet } from 'ai';
import { z } from 'zod';

const getWeatherInformation = tool({
  description: 'show the weather in a given city to the user',
  inputSchema: z.object({ city: z.string() }),
  outputSchema: z.string(), // 必须定义 outputSchema
  // 无 execute 函数，需要人在回路中
});

const getLocalTime = tool({
  description: 'get the local time for a specified location',
  inputSchema: z.object({ location: z.string() }),
  // 包含 execute 函数 -> 无需确认
  execute: async ({ location }) => {
    console.log(`Getting local time for ${location}`);
    return '10am';
  },
});

export const tools = {
  getWeatherInformation,
  getLocalTime,
} satisfies ToolSet;
