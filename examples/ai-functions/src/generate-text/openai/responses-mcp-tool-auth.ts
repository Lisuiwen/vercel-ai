import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { run } from '../../lib/run';
import { getMCPToken } from '../../lib/mcp-oauth';

run(async () => {
  const serverUrl = 'https://mcp.vercel.com/';

  // 获取 OAuth 令牌
  const accessToken = await getMCPToken(serverUrl);

  const result = await generateText({
    model: openai.responses('gpt-5-mini'),
    prompt: 'What tools you got?',
    tools: {
      mcp: openai.tools.mcp({
        serverLabel: 'vercel',
        serverUrl,
        authorization: `${accessToken}`,
        serverDescription: 'A project management tool / API for AI agents',
      }),
    },
  });

  console.log('\nTOOL CALLS:\n');
  console.dir(result.toolCalls, { depth: Infinity });
  console.log('\nTOOL RESULTS:\n');
  console.dir(result.toolResults, { depth: Infinity });
  console.log('\nTEXT RESULT:\n');
  console.log(result.text);
});
