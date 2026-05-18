# AI SDK - OpenAI Compatible 提供商

本包为实现暴露 OpenAI 兼容 API 的提供商提供基础能力。

主 [OpenAI 提供商](../openai/README.md) 功能更丰富，包含 OpenAI 专有实验性与遗留特性。本包是更轻量的替代方案，聚焦核心 OpenAI 兼容能力。

> **Deploying to Vercel?** With Vercel's AI Gateway you can access hundreds of models from any provider — no additional packages, API keys, or extra cost. [Get started with AI Gateway](https://vercel.com/ai-gateway).

## 安装

可在 `@ai-sdk/openai-compatible` 模块中使用，安装方式：

```bash
npm i @ai-sdk/openai-compatible
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/openai-compatible` 导入 `createOpenAICompatible`：

```ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
```

## 示例

```ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

const { text } = await generateText({
  model: createOpenAICompatible({
    baseURL: 'https://api.example.com/v1',
    name: 'example',
    apiKey: process.env.MY_API_KEY,
  }).chatModel('meta-llama/Llama-3-70b-chat-hf'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

### 自定义请求头

可按需自定义请求头。例如通过 Bearer 传递 API Key：

```ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

const { text } = await generateText({
  model: createOpenAICompatible({
    baseURL: 'https://api.example.com/v1',
    name: 'example',
    headers: {
      Authorization: `Bearer ${process.env.MY_API_KEY}`,
    },
  }).chatModel('meta-llama/Llama-3-70b-chat-hf'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

### 包含模型 ID 以支持自动补全

```ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

type ExampleChatModelIds =
  | 'meta-llama/Llama-3-70b-chat-hf'
  | 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
  | (string & {});

type ExampleCompletionModelIds =
  | 'codellama/CodeLlama-34b-Instruct-hf'
  | 'Qwen/Qwen2.5-Coder-32B-Instruct'
  | (string & {});

type ExampleEmbeddingModelIds =
  | 'BAAI/bge-large-en-v1.5'
  | 'bert-base-uncased'
  | (string & {});

const model = createOpenAICompatible<
  ExampleChatModelIds,
  ExampleCompletionModelIds,
  ExampleEmbeddingModelIds
>({
  baseURL: 'https://api.example.com/v1',
  name: 'example',
  apiKey: process.env.MY_API_KEY,
});

// Subsequent calls to e.g. `model.chatModel` will auto-complete the model id
// from the list of `ExampleChatModelIds` while still allowing free-form
// strings as well.

const { text } = await generateText({
  model: model.chatModel('meta-llama/Llama-3-70b-chat-hf'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

更多示例见 [OpenAI 兼容提供商](https://ai-sdk.dev/providers/openai-compatible-providers) 文档。
