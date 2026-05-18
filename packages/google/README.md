# AI SDK - Google Provider

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Google provider](https://ai-sdk.dev/providers/ai-sdk-providers/google)** contains language model support for the [Google Generative AI](https://ai.google/discover/generativeai/) APIs.

> **Deploying to Vercel?** With Vercel's AI Gateway you can access Google (and hundreds of models from other providers) — no additional packages, API keys, or extra cost. [Get started with AI Gateway](https://vercel.com/ai-gateway).

## 安装

Google 提供商位于 `@ai-sdk/google` 模块，安装方式：



```bash
npm i @ai-sdk/google
```

## Skill for Coding Agents

If you use coding agents such as Claude Code or Cursor, we highly recommend adding the AI SDK skill to your repository:

```shell
npx skills add vercel/ai
```

## Provider Instance

可从 `@ai-sdk/google` 导入默认提供商实例 `google`：



```ts
import { google } from '@ai-sdk/google';
```

## Example

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text } = await generateText({
  model: google('gemini-2.5-pro'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## Documentation

更多信息请参阅 **[Google 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/google)**。
