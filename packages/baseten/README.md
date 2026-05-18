# AI SDK - Baseten 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Baseten provider](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)** contains language model and embedding model support for the [Baseten](https://baseten.co) platform.

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Baseten（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Baseten 提供商位于 `@ai-sdk/baseten` 模块，安装方式：



```bash
npm i @ai-sdk/baseten
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/baseten` 导入默认提供商实例 `baseten`：



```ts
import { baseten } from '@ai-sdk/baseten';
```

## Language Model Example (Model APIs)

```ts
import { baseten } from '@ai-sdk/baseten';
import { generateText } from 'ai';

const { text } = await generateText({
  model: baseten('deepseek-ai/DeepSeek-V3-0324'),
  prompt: 'What is the meaning of life?',
});
```

## 文档

更多信息请参阅 **[Baseten 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)**。
