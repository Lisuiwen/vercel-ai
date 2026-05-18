import {
  anthropic,
  type AnthropicLanguageModelOptions,
} from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import fs from 'node:fs';
import { run } from '../../lib/run';

const errorMessage = fs.readFileSync('data/error-message.txt', 'utf8');

const cachedMessage = `The time is ${new Date().toISOString()}. Error message: ${errorMessage}`;

run(async () => {
  const result = await generateText({
    model: anthropic('claude-haiku-4-5'),
    headers: {
      'anthropic-beta': 'extended-cache-ttl-2025-04-11',
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You are a JavaScript expert.',
          },
          {
            type: 'text',
            text: cachedMessage,
            providerOptions: {
              anthropic: {
                cacheControl: { type: 'ephemeral', ttl: '1h' },
              } satisfies AnthropicLanguageModelOptions,
            },
          },
          {
            type: 'text',
            text: 'Explain the error message.',
          },
        ],
      },
    ],
  });

  console.log(
    'Usage information:',
    result.finalStep.providerMetadata?.anthropic?.usage,
  );

  // 例如
  // 使用信息：{
  //   输入令牌：10，
  //   缓存创建输入令牌：2177，
  //   缓存读取输入令牌：0，
  //   缓存创建：{ ephemeral_5m_input_tokens：0，ephemeral_1h_input_tokens：2177 }，
  //   输出令牌：285，
  //   service_tier: 'standard'
  // }

  const cachedResult = await generateText({
    model: anthropic('claude-haiku-4-5'),
    headers: {
      'anthropic-beta': 'extended-cache-ttl-2025-04-11',
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You are a JavaScript expert.',
          },
          {
            type: 'text',
            text: cachedMessage,
            providerOptions: {
              anthropic: {
                cacheControl: { type: 'ephemeral', ttl: '1h' },
              },
            },
          },
          {
            type: 'text',
            text: 'What is this?.',
          },
        ],
      },
    ],
  });

  console.log(
    'Usage information:',
    cachedResult.finalStep.providerMetadata?.anthropic?.usage,
  );

  // 例如
  // 使用信息：{
  //   输入令牌：8，
  //   缓存创建输入令牌：0，
  //   缓存读取输入令牌：2177，
  //   缓存创建：{ ephemeral_5m_input_tokens：0，ephemeral_1h_input_tokens：0 }，
  //   输出令牌：317，
  //   service_tier: 'standard'
  // }
});
