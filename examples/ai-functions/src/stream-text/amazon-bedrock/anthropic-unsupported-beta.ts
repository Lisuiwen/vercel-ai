import { createBedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';
import { streamText } from 'ai';
import 'dotenv/config';
import type { AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';

const bedrockAnthropic = createBedrockAnthropic();

async function main() {
  try {
    // Bedrock 不支持编辑思维 beta 标头。
    // 这应该会触发 Bedrock 的模型级错误。
    const result = streamText({
      model: bedrockAnthropic('us.anthropic.claude-sonnet-4-5-20250929-v1:0'),
      prompt: 'Say hello.',
      providerOptions: {
        anthropic: {
          anthropicBeta: ['redact-thinking-2026-02-12'],
        } satisfies AnthropicLanguageModelOptions,
      },
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
  } catch (error) {
    // 客户端/AI网关看到的内容：
    console.error('Error message:', (error as Error).message);
    console.error('Status code:', (error as any).statusCode);
  }
}

main();
