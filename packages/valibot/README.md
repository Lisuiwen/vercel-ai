# AI SDK - Valibot Schema Support

允许在 AI SDK 中使用 [Valibot](https://valibot.dev/) schema。

`valibotSchema` 函数支持 Valibot schema 的校验与 JSON schema 转换。

## 安装

```bash
npm install @ai-sdk/valibot
```

## 示例

```ts
import { anthropic } from '@ai-sdk/anthropic';
import { valibotSchema } from '@ai-sdk/valibot';
import { generateText, Output } from 'ai';
import * as v from 'valibot';

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  output: Output.object({
    schema: valibotSchema(
      v.object({
        recipe: v.object({
          name: v.string(),
          ingredients: v.array(
            v.object({
              name: v.string(),
              amount: v.string(),
            }),
          ),
          steps: v.array(v.string()),
        }),
      }),
    ),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```
