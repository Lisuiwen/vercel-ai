import { openai } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import { expenseSchema } from './schema';

// 允许流式响应最长 30 秒
export const maxDuration = 30;

export async function POST(req: Request) {
  const { expense }: { expense: string } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    instructions:
      'You categorize expenses into one of the following categories: ' +
      'TRAVEL, MEALS, ENTERTAINMENT, OFFICE SUPPLIES, OTHER.' +
      // 提供日期（含星期）供参考：
      'The current date is: ' +
      new Date()
        .toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          weekday: 'short',
        })
        .replace(/(\w+), (\w+) (\d+), (\d+)/, '$4-$2-$3 ($1)') +
      '. When no date is supplied, use the current date.',
    prompt: `Please categorize the following expense: "${expense}"`,
    output: Output.object({ schema: expenseSchema }),
  });

  return result.toTextStreamResponse();
}
