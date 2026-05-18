# AI SDK - OpenAI Provider

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[OpenAI provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai)**
提供 OpenAI chat and completion APIs and embedding model support for the OpenAI embeddings API 的语言模型支持。

> **Deploying to Vercel?** With Vercel's AI Gateway you can access OpenAI (and hundreds of models from other providers) — no additional packages, API keys, or extra cost. [Get started with AI Gateway](https://vercel.com/ai-gateway).

## 安装

OpenAI 提供商位于 `@ai-sdk/openai` 模块，安装方式：



```bash
npm i @ai-sdk/openai
```

## Skill for Coding Agents

If you use coding agents such as Claude Code or Cursor, we highly recommend adding the AI SDK skill to your repository:

```shell
npx skills add vercel/ai
```

## Provider Instance

可从 `@ai-sdk/openai` 导入默认提供商实例 `openai`：



```ts
import { openai } from '@ai-sdk/openai';
```

## Example

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: openai('gpt-5-mini'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## Documentation

更多信息请参阅 **[OpenAI 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/openai)**。
