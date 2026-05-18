# AI SDK - Moonshot AI 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Moonshot AI provider](https://ai-sdk.dev/providers/ai-sdk-providers/moonshotai)** 提供对 [Moonshot AI](https://platform.moonshot.cn) platform, including the Kimi model series 的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Moonshot AI（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Moonshot AI 提供商位于 `@ai-sdk/moonshotai` 模块，安装方式：



```bash
npm i @ai-sdk/moonshotai
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/moonshotai` 导入默认提供商实例 `moonshotai`：



```ts
import { moonshotai } from '@ai-sdk/moonshotai';
```

## Language Model Example

```ts
import { moonshotai } from '@ai-sdk/moonshotai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: moonshotai('kimi-k2.5'),
  prompt: 'Write a JavaScript function that sorts a list:',
});
```

## Thinking Mode Example (Kimi K2 Thinking)

```ts
import { moonshotai } from '@ai-sdk/moonshotai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: moonshotai('kimi-k2-thinking'),
  prompt: 'Solve this problem step by step: What is 15% of 240?',
  moonshotai: {
    thinking: {
      type: 'enabled',
      budgetTokens: 2048,
    },
    reasoningHistory: 'interleaved',
  },
});
```

## 文档

更多信息请参阅 **[Moonshot AI 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/moonshotai)**。
