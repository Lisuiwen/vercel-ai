import { generateText } from 'ai';
import { run } from '../../lib/run';
import {
  openai,
  type OpenAILanguageModelResponsesOptions,
  type OpenaiResponsesReasoningProviderMetadata,
} from '@ai-sdk/openai';
run(async () => {
  const result = await generateText({
    model: openai('gpt-5'),
    prompt: 'How many "r"s are in the word "strawberry"?',
    reasoning: 'low',
    providerOptions: {
      openai: {
        reasoningSummary: 'detailed',
        store: false,
        include: ['reasoning.encrypted_content'], // 使用加密推理项目
      } satisfies OpenAILanguageModelResponsesOptions,
    },
  });

  for (const part of result.content) {
    switch (part.type) {
      case 'reasoning': {
        console.log('--- reasoning ---');
        console.log(part.text);
        const providerMetadata = part.providerMetadata as
          | OpenaiResponsesReasoningProviderMetadata
          | undefined;
        if (!providerMetadata) break;
        const {
          openai: { itemId, reasoningEncryptedContent },
        } = providerMetadata;
        console.log(`itemId: ${itemId}`);

        // 在 Responses API 中，显式将 store 设置为 false 会选择退出对话历史记录和推理令牌存储。
        // 因此，reasoningEncryptedContent 用于恢复对话历史记录的推理令牌。
        console.log(`reasoningEncryptedContent: ${reasoningEncryptedContent}`);
        break;
      }
      case 'text': {
        console.log('--- text ---');
        console.log(part.text);
        break;
      }
    }
    console.log();
  }
});
