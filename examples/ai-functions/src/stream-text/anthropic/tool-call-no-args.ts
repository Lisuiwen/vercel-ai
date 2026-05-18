import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { run } from '../../lib/run';
import { printFullStream } from '../../lib/print-full-stream';

run(async () => {
  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    tools: {
      updateIssueList: tool({
        inputSchema: z.object({}), // 空输入模式
      }),
    },
    prompt: 'Update the issue list',
  });

  await printFullStream({ result });
});
