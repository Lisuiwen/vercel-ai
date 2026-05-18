# AI SDK - Cerebras 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **Cerebras 提供商** contains language model support for [Cerebras](https://cerebras.ai), offering high-speed AI model inference powered by Cerebras Wafer-Scale Engines and CS-3 systems.

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Cerebras（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Cerebras 提供商位于 `@ai-sdk/cerebras` 模块，安装方式：



```bash
npm i @ai-sdk/cerebras
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/cerebras` 导入默认提供商实例 `cerebras`：



```ts
import { cerebras } from '@ai-sdk/cerebras';
```

## Available Models

Cerebras offers a variety of high-performance language models:
https://inference-docs.cerebras.ai/models/overview

## 示例

```ts
import { cerebras } from '@ai-sdk/cerebras';
import { generateText } from 'ai';

const { text } = await generateText({
  model: cerebras('llama-3.3-70b'),
  prompt: 'Write a JavaScript function that sorts a list:',
});
```

## 文档

有关 Cerebras 高速推理能力与 API 文档的更多信息，请访问：

- [Cerebras Inference Documentation](https://inference-docs.cerebras.ai/introduction)
- [Cerebras Website](https://cerebras.ai)

Note: Due to high demand in the early launch phase, context windows are temporarily limited to 8192 tokens in the Free Tier.
