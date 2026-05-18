# AI SDK、Next.js、LangChain、OpenAI 示例

本示例演示如何将 [AI SDK](https://ai-sdk.dev/docs) 与 [Next.js](https://nextjs.org/)、[LangChain](https://js.langchain.com)、[LangGraph](https://langchain-ai.github.io/langgraph/) 和 [OpenAI](https://openai.com) 结合，构建 AI 驱动的流式应用。

## 包含的示例

### 1. 基础聊天（`/`）

使用 LangChain `ChatOpenAI`、消息流式与 `@ai-sdk/langchain` 适配器的基础聊天示例。

### 2. 文本补全（`/completion`）

使用 `useCompletion` hook 与 LangChain 流式的简单文本补全：

- **`useCompletion`**：使用 AI SDK 补全 hook 进行单轮文本生成
- **流式**：来自 LangChain `ChatOpenAI` 的实时 token 流
- **`toUIMessageStream`**：将 LangChain 流转为 AI SDK 格式

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { toUIMessageStream } from '@ai-sdk/langchain';

const model = new ChatOpenAI({ model: 'gpt-4o-mini' });
const stream = await model.stream([{ role: 'user', content: prompt }]);

return createUIMessageStreamResponse({
  stream: toUIMessageStream(stream),
});
```

### 3. LangGraph（`/langgraph`）

演示 `@ai-sdk/langchain` 适配器与 LangGraph：

- **`toBaseMessages`**：将 AI SDK `UIMessage` 转为 LangChain `BaseMessage`
- **`toUIMessageStream`**：将 LangGraph 流转为 AI SDK `UIMessageChunk`

演示如何将 LangGraph Agent 与 AI SDK `useChat` hook 集成。

### 4. 多模态视觉输入（`/multimodal`）

演示通过 `@ai-sdk/langchain` 适配器向模型发送图像进行分析：

- **图像上传**：在聊天界面直接附加图像
- **视觉分析**：使用 GPT-4o 视觉能力分析图像
- **多模态转换**：适配器将图像转为 OpenAI `image_url` 格式供视觉模型使用

展示 `convertUserContent()` 对图像与文件的多模态输入支持。

### 5. 图像生成输出（`/image-generation`）

演示使用 OpenAI 图像生成工具以多模态输出方式生成图像：

- **Responses API**：`ChatOpenAI` 设置 `useResponsesApi: true` 以使用内置工具
- **图像生成工具**：使用 `@langchain/openai` 的 `tools.imageGeneration()`
- **流式输出**：生成的图像作为响应的一部分流式返回
- **AI SDK 集成**：通过标准 message parts 系统渲染图像

```typescript
import { ChatOpenAI, tools } from '@langchain/openai';

const model = new ChatOpenAI({
  model: 'gpt-4o',
  useResponsesApi: true,
});

const modelWithImageGeneration = model.bindTools([
  tools.imageGeneration({
    size: '1024x1024',
    quality: 'medium',
    outputFormat: 'png',
  }),
]);
```

### 6. ReAct Agent（`/createAgent`）

展示 LangChain `createAgent` 与 AI SDK 适配器：

- 使用 LangChain `createAgent()` 创建 Agent
- 使用 `@langchain/core/tools` 定义工具
- 使用 `toUIMessageStream` 流式返回响应
- **图像生成**：使用 OpenAI [Image Generation Tool](https://docs.langchain.com/oss/javascript/integrations/tools/openai#image-generation-tool) 生成图像

### 7. Human-in-the-Loop（`/hitl`）

演示 LangChain `humanInTheLoopMiddleware`：执行敏感工具前需用户批准：

- **`humanInTheLoopMiddleware`**：拦截工具调用并请求用户批准的中间件
- **选择性批准**：配置哪些工具需批准、哪些自动通过
- **批准工作流**：结合 AI SDK `dynamic-tool` parts 使用 `addToolApprovalResponse`
- **线程持久化**：使用 `MemorySaver` 在批准流程间保持对话状态

```typescript
import { createAgent, humanInTheLoopMiddleware } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';

const agent = createAgent({
  model,
  tools: [sendEmailTool, deleteFileTool, searchTool],
  checkpointer: new MemorySaver(),
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        send_email: { allowedDecisions: ['approve', 'edit', 'reject'] },
        delete_file: { allowedDecisions: ['approve', 'reject'] },
        search: false, // Auto-approve safe operations
      },
    }),
  ],
});
```

### 8. 自定义 Data Parts（`/custom-data`）

演示来自 LangGraph 工具的自定义流式事件：

- 使用 `config.writer()` 发出类型化进度/状态更新
- 带 `type` 的自定义数据变为 `data-{type}` 事件（如 `data-progress`）
- 包含 `id` 以在 `message.parts` 中持久化供渲染
- 无 `id` 的瞬态数据仅通过 `onData` 回调传递

### 9. LangGraph Transport（`/langsmith`）

在浏览器中使用 `LangSmithDeploymentTransport` 直接连接 LangGraph 应用：

- 使用 `LangSmithDeploymentTransport` 创建客户端通信 transport
- 无需后端路由，直接与 LangGraph 服务器通信
- 支持本地开发服务器与 LangSmith 部署
- 包含用于开发的本地 LangGraph 服务器（见下文）

## 自行部署

使用 [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=ai-sdk-example) 部署本示例：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Ftree%2Fmain%2Fexamples%2Fnext-langchain&env=OPENAI_API_KEY&envDescription=OpenAI%20API%20Key&envLink=https%3A%2F%2Fplatform.openai.com%2Faccount%2Fapi-keys&project-name=ai-chat-langchain&repository-name=next-ai-chat-langchain)

## 使用方法

使用 [npm](https://docs.npmjs.com/cli/init)、[Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) 或 [pnpm](https://pnpm.io) 执行 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 初始化示例：

```bash
npx create-next-app --example https://github.com/vercel/ai/tree/main/examples/next-langchain next-langchain-app
```

```bash
yarn create next-app --example https://github.com/vercel/ai/tree/main/examples/next-langchain next-langchain-app
```

```bash
pnpm create next-app --example https://github.com/vercel/ai/tree/main/examples/next-langchain next-langchain-app
```

本地运行需完成：

1. 在 [OpenAI 开发者平台](https://platform.openai.com/signup) 注册。
2. 在 [OpenAI 控制台](https://platform.openai.com/account/api-keys) 创建 API Key。
3. 参照[示例 env 文件](./.env.local.example)，在 `.env.local` 中设置 OpenAI 环境变量。
4. 执行 `pnpm install` 安装依赖。
5. 执行 `pnpm dev` 启动开发服务器。

## 关键代码模式

### 将 UIMessage 转为 LangChain 消息

```typescript
import { toBaseMessages } from '@ai-sdk/langchain';

// Simple one-line conversion - no factory functions needed!
const langchainMessages = await toBaseMessages(uiMessages);
```

### 从 LangGraph 流式传输

```typescript
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';

// Convert messages
const langchainMessages = await toBaseMessages(messages);

// Stream from graph
const stream = await graph.stream(
  { messages: langchainMessages },
  { streamMode: ['values', 'messages'] },
);

// Return UI stream response
return createUIMessageStreamResponse({
  stream: toUIMessageStream(stream),
});
```

### 创建 LangChain Agent

```typescript
import { createAgent } from 'langchain';
import { tool } from '@langchain/core/tools';
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';
import { z } from 'zod';

// Define a tool using LangChain's tool decorator
const weatherTool = tool(
  async ({ city }) => `Weather in ${city}: sunny, 72°F`,
  {
    name: 'get_weather',
    description: 'Get the current weather in a location',
    schema: z.object({ city: z.string() }),
  },
);

// Create a LangChain agent
const agent = createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [weatherTool],
  systemPrompt: 'You are a helpful weather assistant.',
});

// Convert messages and stream with the adapter
const langchainMessages = await toBaseMessages(messages);
const stream = await agent.stream(
  { messages: langchainMessages },
  { streamMode: ['values', 'messages'] },
);

return createUIMessageStreamResponse({
  stream: toUIMessageStream(stream),
});
```

### 从工具流式传输自定义数据

```typescript
import { tool, type ToolRuntime } from 'langchain';
import { z } from 'zod';

const analyzeDataTool = tool(
  async ({ dataSource }, config: ToolRuntime) => {
    // Emit progress updates - becomes 'data-progress' in the UI
    config.writer?.({
      type: 'progress',
      id: 'analysis-1', // Include 'id' to persist in message.parts
      step: 'processing',
      message: 'Running analysis...',
      progress: 50,
    });

    // ... perform work ...

    return 'Analysis complete';
  },
  {
    name: 'analyze_data',
    description: 'Analyze data with progress updates',
    schema: z.object({ dataSource: z.string() }),
  },
);

// Enable 'custom' stream mode
const stream = await graph.stream(
  { messages: langchainMessages },
  { streamMode: ['values', 'messages', 'custom'] },
);
```

### 连接 LangGraph（客户端）

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { LangSmithDeploymentTransport } from '@ai-sdk/langchain';
import { useMemo } from 'react';

function Chat() {
  const transport = useMemo(
    () =>
      new LangSmithDeploymentTransport({
        // Local development server:
        url: 'http://localhost:2024',
        // Or for a LangSmith deployment:
        // url: 'https://your-deployment.langsmith.app',
        // apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY,
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  // ... render chat UI
}
```

## 在 stream() 与 streamEvents() 之间选择

`@ai-sdk/langchain` 适配器同时支持 `graph.stream()` 与 `streamEvents()`，可按场景选择：

### 何时使用带 `streamMode` 的 `graph.stream()`

| 用例 | 原因 |
| --- | --- |
| **LangGraph 工作流** | 针对带 `values`、`messages`、`updates` 模式的状态图优化 |
| **工具执行跟踪** | `messages` 模式下工具调用生命周期清晰 |
| **自定义数据流** | 用 `custom` 模式与 `config.writer()` 发送类型化事件 |
| **状态快照** | `values` 模式可在每步后获取完整状态 |
| **生产应用** | 与 AI SDK `toUIMessageStream` 集成更简单 |

```typescript
const stream = await graph.stream(
  { messages },
  { streamMode: ['values', 'messages'] },
);
```

### 何时使用 `streamEvents()`

| Use Case                    | Why                                                                     |
| --------------------------- | ----------------------------------------------------------------------- |
| **调试/可观测性** | 获取链中各组件的详细事件 |
| **按事件类型过滤** | 过滤 `on_chat_model_stream`、`on_tool_start` 等 |
| **运行元数据** | 访问各组件的 run ID、名称、标签 |
| **LCEL 迁移** | 迁移依赖基于回调流式的应用 |
| **简单模型流式** | 无需 LangGraph 的直接模型流式 |

```typescript
const streamEvents = model.streamEvents(messages, {
  version: 'v2',
});
```

### streamEvents() 中的事件类型

| 事件 | 说明 |
| --- | --- |
| `on_chat_model_start` | 模型调用开始 |
| `on_chat_model_stream` | 收到 token 块 |
| `on_chat_model_end` | 模型完成并返回完整消息 |
| `on_tool_start` | 工具执行开始 |
| `on_tool_end` | 工具执行完成 |
| `on_chain_start/end` | 链/图生命周期事件 |

多数 LangGraph 应用推荐使用带合适 `streamMode` 的 `graph.stream()`；需要更细粒度调试或使用纯 LangChain（非 LangGraph）时再用 `streamEvents()`。

## 延伸阅读

进一步了解 LangChain、LangGraph、OpenAI、Next.js 与 AI SDK，可参考：

- [AI SDK 文档](https://ai-sdk.dev/docs) - 了解 AI SDK
- [Vercel AI Playground](https://ai-sdk.dev/playground) - 并排对比与调优 20+ 模型
- [LangChain 文档](https://js.langchain.com/docs) - 了解 LangChain
- [LangGraph 文档](https://langchain-ai.github.io/langgraph/) - 了解 LangGraph
- [LangSmith 文档](https://docs.smith.langchain.com/) - 了解 LangSmith 部署
- [OpenAI 文档](https://platform.openai.com/docs) - 了解 OpenAI 功能与 API
- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 功能与 API
