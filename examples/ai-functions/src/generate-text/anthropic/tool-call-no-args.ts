import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { run } from '../../lib/run';
import { print } from '../../lib/print';

run(async () => {
  const result = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    tools: {
      updateIssueList: tool({
        inputSchema: z.object({}), // 空输入模式
      }),
    },
    prompt: 'Update the issue list',
  });

  print('Content:', result.content);
});
