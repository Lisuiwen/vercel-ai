# AI SDK - Google Vertex AI 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Google Vertex provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)** 提供对 [Google Vertex AI](https://cloud.google.com/vertex-ai) APIs 的语言模型支持。

本库包含 Google Vertex Anthropic 提供商与 Google Vertex MaaS 提供商，用法与核心 Google Vertex 库相近。详见下文 [Google Vertex Anthropic 提供商](#google-vertex-anthropic-provider) 与 [Google Vertex MaaS 提供商](#google-vertex-maas-provider)。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Google Vertex AI（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Google Vertex 提供商位于 `@ai-sdk/google-vertex` 模块，安装方式：



```bash
npm i @ai-sdk/google-vertex
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## Google Vertex Provider

Google Vertex 提供商根据运行时环境提供两种身份验证实现：

### Node.js 运行时

Node.js 运行时是 AI SDK 默认支持的运行时。可使用默认提供商实例与 `gemini-2.5-flash` 模型生成文本：

```ts
import { vertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';

const { text } = await generateText({
  model: vertex('gemini-2.5-flash'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

本提供商通过 [`google-auth-library`](https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#ways-to-authenticate) 支持所有标准 Google Cloud 身份验证方式。最常见做法是在 `GOOGLE_APPLICATION_CREDENTIALS` 中设置 JSON 凭证文件路径。凭证可从 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 获取。

### Edge 运行时

Edge 运行时通过 `@ai-sdk/google-vertex/edge` 模块支持。需注意额外的 `/edge` 子模块路径，以区分 Edge 与 Node.js 提供商。

可使用默认提供商实例与 `gemini-2.5-flash` 模型生成文本：

```ts
import { vertex } from '@ai-sdk/google-vertex/edge';
import { generateText } from 'ai';

const { text } = await generateText({
  model: vertex('gemini-2.5-flash'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

此方式通过环境变量 `GOOGLE_CLIENT_EMAIL`、`GOOGLE_PRIVATE_KEY` 及（可选）`GOOGLE_PRIVATE_KEY_ID` 支持 Google [Application Default Credentials](https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#application-default-credentials)。值可从 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 获取的 JSON 凭证文件中取得。

## Google Vertex Anthropic Provider

Google Vertex Anthropic 提供商同时支持 Node.js 与 Edge 运行时，用法与[核心 Google Vertex 提供商](#google-vertex-provider)类似。

### Node.js 运行时

```ts
import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { generateText } from 'ai';

const { text } = await generateText({
  model: vertexAnthropic('claude-3-5-sonnet@20240620'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

### Edge 运行时

```ts
import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic/edge';
import { generateText } from 'ai';

const { text } = await generateText({
  model: vertexAnthropic('claude-3-5-sonnet@20240620'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

## Prompt Caching Support for Anthropic Claude Models

Google Vertex Anthropic 提供商为 Anthropic Claude 模型支持 prompt caching，通过对相同请求复用缓存降低延迟与成本。缓存按 Google Cloud 项目隔离，生命周期为五分钟。

### Enabling Prompt Caching

To enable prompt caching, you can use the `cacheControl` property in the settings. Here is an example demonstrating how to enable prompt caching:

```ts
import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { generateText } from 'ai';
import fs from 'node:fs';

const errorMessage = fs.readFileSync('data/error-message.txt', 'utf8');

async function main() {
  const result = await generateText({
    model: vertexAnthropic('claude-3-5-sonnet-v2@20241022', {
      cacheControl: true,
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You are a JavaScript expert.',
          },
          {
            type: 'text',
            text: `Error message: ${errorMessage}`,
            providerOptions: {
              anthropic: {
                cacheControl: { type: 'ephemeral' },
              },
            },
          },
          {
            type: 'text',
            text: 'Explain the error message.',
          },
        ],
      },
    ],
  });

  console.log(result.text);
  console.log(result.providerMetadata?.anthropic);
}

main().catch(console.error);
```

## Custom Provider Configuration

可使用 `createVertex` 创建自定义提供商实例以指定更多配置。以下为包含 `googleAuthOptions` 的默认 Node.js 提供商示例。

```ts
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';

const customProvider = createVertex({
  project: 'your-project-id',
  location: 'us-central1',
  googleAuthOptions: {
    credentials: {
      client_email: 'your-client-email',
      private_key: 'your-private-key',
    },
  },
});

const { text } = await generateText({
  model: customProvider('gemini-2.5-flash'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

Edge 提供商选项中不含 `googleAuthOptions`，但自定义提供商创建方式 除此以外相同。

Edge 提供商使用 `googleCredentials` 而非 `googleAuthOptions`，可指定 Google Cloud 服务账号凭证，并优先于其他环境变量。

```ts
import { createVertex } from '@ai-sdk/google-vertex/edge';
import { generateText } from 'ai';

const customProvider = createVertex({
  project: 'your-project-id',
  location: 'us-central1',
  googleCredentials: {
    clientEmail: 'your-client-email',
    privateKey: 'your-private-key',
  },
});

const { text } = await generateText({
  model: customProvider('gemini-2.5-flash'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

### Google Vertex Anthropic Provider Custom Configuration

Google Vertex Anthropic 提供商的自定义配置与上文类似：

```ts
import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
import { generateText } from 'ai';

const customProvider = createVertexAnthropic({
  project: 'your-project-id',
  location: 'us-east5',
});

const { text } = await generateText({
  model: customProvider('claude-3-5-sonnet@20240620'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

And for the Edge runtime:

```ts
import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic/edge';
import { generateText } from 'ai';

const customProvider = createVertexAnthropic({
  project: 'your-project-id',
  location: 'us-east5',
});

const { text } = await generateText({
  model: customProvider('claude-3-5-sonnet@20240620'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

## Google Vertex MaaS Provider

Google Vertex MaaS（Model as a Service）提供商通过 OpenAI 兼容的 Chat Completions API 访问 Vertex AI 上的合作伙伴与开源模型，支持 Node.js 与 Edge 运行时。

### Node.js 运行时

```ts
import { vertexMaas } from '@ai-sdk/google-vertex/maas';
import { generateText } from 'ai';

const { text } = await generateText({
  model: vertexMaas('deepseek-ai/deepseek-v3.2-maas'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

### Edge 运行时

```ts
import { vertexMaas } from '@ai-sdk/google-vertex/maas/edge';
import { generateText } from 'ai';

const { text } = await generateText({
  model: vertexMaas('deepseek-ai/deepseek-v3.2-maas'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

### Google Vertex MaaS Provider Custom Configuration

```ts
import { createVertexMaas } from '@ai-sdk/google-vertex/maas';
import { generateText } from 'ai';

const customProvider = createVertexMaas({
  project: 'your-project-id',
  location: 'us-east5',
});

const { text } = await generateText({
  model: customProvider('deepseek-ai/deepseek-v3.2-maas'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

And for the Edge runtime:

```ts
import { createVertexMaas } from '@ai-sdk/google-vertex/maas/edge';
import { generateText } from 'ai';

const customProvider = createVertexMaas({
  project: 'your-project-id',
  location: 'us-east5',
});

const { text } = await generateText({
  model: customProvider('deepseek-ai/deepseek-v3.2-maas'),
  prompt: 'Write a vegetarian lasagna recipe.',
});
```

## 文档

更多信息请参阅 **[Google Vertex 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)**。
