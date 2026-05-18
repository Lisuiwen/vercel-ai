import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  try {
    const result = streamText({
      model: groq('openai/gpt-oss-120b'),
      prompt:
        'What happened in AI last week? Give me a concise summary of the most important events.',
      tools: {
        browser_search: groq.tools.browserSearch({}),
      },
      // 使用所需的工具选择以确保使用浏览器搜索
      toolChoice: 'required',
    });

    console.log('Starting browser search...\n');

    for await (const delta of result.fullStream) {
      switch (delta.type) {
        case 'text-delta': {
          process.stdout.write(delta.text);
          break;
        }
        case 'tool-call': {
          console.log(`\n[Tool Call] ${delta.toolName}`);
          break;
        }
        case 'tool-result': {
          console.log(`\n[Tool Result] ${delta.toolName} completed`);
          break;
        }
      }
    }

    console.log('\n\n--- Metadata ---');
    console.log('Usage:', await result.usage);
    console.log('Finish reason:', await result.finishReason);

    // 有关不支持的模型使用的警告
    const warnings = await result.warnings;
    if (warnings && warnings.length > 0) {
      console.log('Warnings:', warnings);
    }
  } catch (error) {
    console.error('Error:', error);

    if (error instanceof Error && error.message.includes('Browser search')) {
      console.error("\nTip: Make sure you're using a supported model:");
      console.error('- openai/gpt-oss-20b');
      console.error('- openai/gpt-oss-120b');
    }
  }

  // 显示不受支持的模型会发生什么情况的示例
  console.log('\n=== Example with unsupported model ===');

  const unsupportedResult = streamText({
    model: groq('gemma2-9b-it'), // 不支持的型号
    prompt: 'Search for AI news',
    tools: {
      browser_search: groq.tools.browserSearch({}),
    },
  });

  const warnings = await unsupportedResult.warnings;
  console.log('Warnings for unsupported model:', warnings);
});
