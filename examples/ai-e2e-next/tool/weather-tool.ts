import { tool, type UIToolInvocation } from 'ai';
import { z } from 'zod';

function randomWeather() {
  const weatherOptions = ['sunny', 'cloudy', 'rainy', 'windy'];
  return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
}

export const weatherTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({ city: z.string() }),
  async *execute() {
    yield { state: 'loading' as const };

    // 随机 1 到 5 秒延迟（用于打乱 tool 结果顺序）
    await new Promise(resolve =>
      setTimeout(resolve, 1000 + Math.floor(Math.random() * 4000)),
    );

    yield {
      state: 'ready' as const,
      temperature: 72,
      weather: randomWeather(),
    };
  },
});

export type WeatherUIToolInvocation = UIToolInvocation<typeof weatherTool>;
