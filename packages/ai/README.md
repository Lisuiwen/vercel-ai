# AI SDK

[AI SDK](https://ai-sdk.dev/docs) 是与具体提供商无关的 TypeScript 工具包，帮助你在 Next.js、React、Svelte、Vue、Angular 等流行 UI 框架以及 Node.js 等运行时上构建 AI 应用与 Agent。

要了解如何使用 AI SDK，请参阅 [API 参考](https://ai-sdk.dev/docs/reference) 与[文档](https://ai-sdk.dev/docs)。

## 安装

本地开发机需安装 Node.js 18+ 以及 npm（或其他包管理器）。

```shell
npm install ai
```



## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```



## 统一提供商架构

AI SDK 提供[统一 API](https://ai-sdk.dev/docs/foundations/providers-and-models)，可与 [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)、[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)、[Google](https://ai-sdk.dev/providers/ai-sdk-providers/google) 等模型提供商交互，[更多](https://ai-sdk.dev/providers/ai-sdk-providers)见文档。

默认通过 [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) 即可使用所有主要提供商，只需传入受支持模型的字符串：

```ts
const result = await generateText({
  model: 'anthropic/claude-opus-4.6', // or 'openai/gpt-5.4', 'google/gemini-3-flash', etc.
  prompt: 'Hello!',
});
```



也可通过各提供商 SDK 包直接连接：

```shell
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```



```ts
import { anthropic } from '@ai-sdk/anthropic';

const result = await generateText({
  model: anthropic('claude-opus-4-6'), // or openai('gpt-5.4'), google('gemini-3-flash'), etc.
  prompt: 'Hello!',
});
```



## 用法

### 生成文本

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-5.4', // use Vercel AI Gateway
  prompt: 'What is an agent?',
});
```



### 生成结构化数据

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

const { output } = await generateText({
  model: 'openai/gpt-5.4',
  output: Output.object({
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(
          z.object({ name: z.string(), amount: z.string() }),
        ),
        steps: z.array(z.string()),
      }),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```



### Agent

```ts
import { ToolLoopAgent } from 'ai';

const sandboxAgent = new ToolLoopAgent({
  model: 'openai/gpt-5.4',
  system: 'You are an agent with access to a shell environment.',
  tools: {
    shell: openai.tools.localShell({
      execute: async ({ action }) => {
        const [cmd, ...args] = action.command;
        const sandbox = await getSandbox(); // Vercel Sandbox
        const command = await sandbox.runCommand({ cmd, args });
        return { output: await command.stdout() };
      },
    }),
  },
});
```



### UI 集成

[AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) 提供一组 hook，用于构建聊天机器人与生成式 UI，且与框架无关，可用于 Next.js、React、Svelte、Vue。

需为所用框架安装对应包，例如：

```shell
npm install @ai-sdk/react
```



#### Agent @/agent/image-generation-agent.ts

```ts
import { openai } from '@ai-sdk/openai';
import { ToolLoopAgent, InferAgentUIMessage } from 'ai';

export const imageGenerationAgent = new ToolLoopAgent({
  model: 'openai/gpt-5.4',
  tools: {
    generateImage: openai.tools.imageGeneration({
      partialImages: 3,
    }),
  },
});

export type ImageGenerationAgentMessage = InferAgentUIMessage<
  typeof imageGenerationAgent
>;
```



#### 路由（Next.js App Router）@/app/api/chat/route.ts

```tsx
import { imageGenerationAgent } from '@/agent/image-generation-agent';
import { createAgentUIStreamResponse } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  return createAgentUIStreamResponse({
    agent: imageGenerationAgent,
    messages,
  });
}
```



#### 工具 UI 组件 @/component/image-generation-view.tsx

```tsx
import { openai } from '@ai-sdk/openai';
import { UIToolInvocation } from 'ai';

export default function ImageGenerationView({
  invocation,
}: {
  invocation: UIToolInvocation<ReturnType<typeof openai.tools.imageGeneration>>;
}) {
  switch (invocation.state) {
    case 'input-available':
      return <div>Generating image...</div>;
    case 'output-available':
      return <img src={`data:image/png;base64,${invocation.output.result}`} />;
  }
}
```



#### 页面 @/app/page.tsx

```tsx
'use client';

import { ImageGenerationAgentMessage } from '@/agent/image-generation-agent';
import ImageGenerationView from '@/component/image-generation-view';
import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, status, sendMessage } =
    useChat<ImageGenerationAgentMessage>();

  const [input, setInput] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <strong>{`${message.role}: `}</strong>
          {message.parts.map((part, index) => {
            switch (part.type) {
              case 'text':
                return <div key={index}>{part.text}</div>;
              case 'tool-generateImage':
                return <ImageGenerationView key={index} invocation={part} />;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'ready'}
        />
      </form>
    </div>
  );
}
```



## 模板

我们提供了包含 AI SDK 集成的[模板](https://ai-sdk.dev/docs/introduction#templates)，覆盖不同用例、提供商与框架，便于快速启动 AI 应用。

## 社区

AI SDK 社区位于 [Vercel Community](https://community.vercel.com/c/ai-sdk/62)，可在此提问、分享想法与项目。

## 贡献

欢迎并非常感谢对 AI SDK 的贡献。在开始之前，请先阅读我们的[贡献指南](https://github.com/vercel/ai/blob/main/CONTRIBUTING.md)，以便顺利参与贡献。

## 作者

本库由 [Vercel](https://vercel.com) 与 [Next.js](https://nextjs.org) 团队成员创建，并得到[开源社区](https://github.com/vercel/ai/graphs/contributors)的贡献。
