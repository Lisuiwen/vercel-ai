# AI SDK - Anthropic Provider

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Anthropic provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)** contains language model support for the [Anthropic Messages API](https://docs.anthropic.com/claude/reference/messages_post).

> **Deploying to Vercel?** With Vercel's AI Gateway you can access Anthropic (and hundreds of models from other providers) — no additional packages, API keys, or extra cost. [Get started with AI Gateway](https://vercel.com/ai-gateway).

## 安装

Anthropic 提供商位于 `@ai-sdk/anthropic` 模块，安装方式：



```bash
npm i @ai-sdk/anthropic
```

## Skill for Coding Agents

If you use coding agents such as Claude Code or Cursor, we highly recommend adding the AI SDK skill to your repository:

```shell
npx skills add vercel/ai
```

## Provider Instance

可从 `@ai-sdk/anthropic` 导入默认提供商实例 `anthropic`：



```ts
import { anthropic } from '@ai-sdk/anthropic';
```

## Example

```ts
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const { text } = await generateText({
  model: anthropic('claude-3-haiku-20240307'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## Documentation

更多信息请参阅 **[Anthropic 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)**。
