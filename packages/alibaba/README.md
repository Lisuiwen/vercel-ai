# AI SDK - Alibaba 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Alibaba provider](https://ai-sdk.dev/providers/ai-sdk-providers/alibaba)** 提供 [Alibaba Cloud Model Studio](https://modelstudio.console.alibabacloud.com/), including the Qwen model series with advanced reasoning capabilities 的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Alibaba（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Alibaba 提供商位于 `@ai-sdk/alibaba` 模块，安装方式：



```bash
npm i @ai-sdk/alibaba
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/alibaba` 导入默认提供商实例 `alibaba`：



```ts
import { alibaba } from '@ai-sdk/alibaba';
```

## Language Model Example

```ts
import { alibaba } from '@ai-sdk/alibaba';
import { generateText } from 'ai';

const { text } = await generateText({
  model: alibaba('qwen-plus'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## Thinking Mode Example (Qwen Reasoning Models)

Alibaba's Qwen models support thinking/reasoning mode for complex problem-solving:

```ts
import { alibaba } from '@ai-sdk/alibaba';
import { generateText } from 'ai';

const { text, reasoningText } = await generateText({
  model: alibaba('qwen3-max'),
  providerOptions: {
    alibaba: {
      enableThinking: true,
      thinkingBudget: 2048,
    },
  },
  prompt: 'How many "r"s are in the word "strawberry"?',
});

console.log('Reasoning:', reasoningText);
console.log('Answer:', text);
```

## Tool Calling Example

```ts
import { alibaba } from '@ai-sdk/alibaba';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text } = await generateText({
  model: alibaba('qwen-plus'),
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

## 显式缓存示例

Alibaba 支持隐式与显式 prompt 缓存，以降低重复 prompt 的成本。

**隐式缓存**自动生效——提供商无需配置即可缓存合适内容。若需更多控制，可通过 `cacheControl` 标记特定消息以使用**显式缓存**：

```ts
import { alibaba } from '@ai-sdk/alibaba';
import { generateText } from 'ai';

const longDocument = '... large document content ...';

const { text, usage } = await generateText({
  model: alibaba('qwen-plus'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Context: Please analyze this document.',
        },
        {
          type: 'text',
          text: longDocument,
          providerOptions: {
            alibaba: {
              cacheControl: { type: 'ephemeral' },
            },
          },
        },
      ],
    },
  ],
});
```

**注意：** 每个缓存块的最小内容为 1,024 tokens。

## 文档

更多信息请参阅 **[Alibaba 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/alibaba)**。
