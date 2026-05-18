# Vercel AI SDK - Hugging Face Provider

面向 [Vercel AI SDK](https://ai-sdk.dev/docs) 的 **[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/index)** 通过 Hugging Face router API，为数千个模型提供多推理提供商的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Hugging Face（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Hugging Face 提供商位于 `@ai-sdk/huggingface` 模块，安装方式：

:

```bash
npm i @ai-sdk/huggingface
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/huggingface` 导入默认提供商实例 `huggingface`：



```ts
import { huggingface } from '@ai-sdk/huggingface';
```

## 示例

```ts
import { huggingface } from '@ai-sdk/huggingface';
import { generateText } from 'ai';

const { text } = await generateText({
  model: huggingface('meta-llama/Llama-3.1-8B-Instruct'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

## 文档

更多信息请参阅 **[Hugging Face 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/huggingface)**。
