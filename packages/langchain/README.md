# AI SDK - LangChain Adapter

**[AI SDK](https://ai-sdk.dev)** 的 LangChain 适配器在 [LangChain](https://langchain.com/) 与 AI SDK 之间提供无缝集成，便于将 LangChain Agent 与图用于 AI SDK UI 组件。

## 安装

```bash
npm install @ai-sdk/langchain @langchain/core
```

> **注意：** `@langchain/core` 为必需的 peer dependency。

## 功能

- 将 AI SDK `UIMessage` 转为 LangChain `BaseMessage`
- 将 LangChain/LangGraph 流转为 AI SDK `UIMessageStream`
- 面向 LangSmith 部署的 `ChatTransport` 实现
- 完整支持文本、工具调用与工具结果
- 使用类型化事件（`data-{type}`）的自定义数据流

## 用法

### 转换消息

使用 `toBaseMessages` 将 AI SDK 消息转为 LangChain 格式：

```ts
import { toBaseMessages } from '@ai-sdk/langchain';

// Convert UI messages to LangChain format
const langchainMessages = await toBaseMessages(uiMessages);

// Use with any LangChain model
const response = await model.invoke(langchainMessages);
```

### 从 LangGraph 流式传输

使用 `toUIMessageStream` 将 LangGraph 流转为 AI SDK 格式：

```ts
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';

// Convert messages and stream from a LangGraph graph
const langchainMessages = await toBaseMessages(uiMessages);

const langchainStream = await graph.stream(
  { messages: langchainMessages },
  { streamMode: ['values', 'messages'] },
);

// Convert to UI message stream response
return createUIMessageStreamResponse({
  stream: toUIMessageStream(langchainStream),
});
```

### 使用回调进行流式传输

使用回调访问最终 LangGraph 状态、处理错误或检测中止：

```ts
const langchainStream = await graph.stream(
  { messages: langchainMessages },
  { streamMode: ['values', 'messages'] },
);

return createUIMessageStreamResponse({
  stream: toUIMessageStream<MyGraphState>(langchainStream, {
    onFinish: async finalState => {
      if (finalState) {
        await saveConversation(finalState.messages);
        await sendAnalytics(finalState);
      }
    },
    onError: error => console.error('Stream failed:', error),
    onAbort: () => console.log('Client disconnected'),
  }),
});
```

### 使用 `streamEvents` 进行流式传输

也可将 `toUIMessageStream` 与 `streamEvents()` 配合以进行更细粒度的事件处理：

```ts
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';

// Using streamEvents with an agent
const langchainMessages = await toBaseMessages(uiMessages);
const streamEvents = agent.streamEvents(
  { messages: langchainMessages },
  { version: 'v2' },
);

// Convert to UI message stream response
return createUIMessageStreamResponse({
  stream: toUIMessageStream(streamEvents),
});
```

适配器自动检测流类型并处理：

- 文本流式的 `on_chat_model_stream` 事件
- 工具调用的 `on_tool_start` 与 `on_tool_end` 事件
- 来自 contentBlocks 的推理内容

### 自定义数据流

LangChain 工具可通过 `config.writer()` 发出自定义数据事件，适配器将其转为类型化 `data-{type}` 部分：

```ts
import { tool, type ToolRuntime } from 'langchain';

const analyzeDataTool = tool(
  async ({ query }, config: ToolRuntime) => {
    // Emit progress updates - becomes 'data-progress' in the UI
    config.writer?.({
      type: 'progress',
      id: 'analysis-1', // Include 'id' to persist in message.parts
      step: 'fetching',
      message: 'Fetching data...',
      progress: 50,
    });

    // ... perform analysis ...

    // Emit status update - becomes 'data-status' in the UI
    config.writer?.({
      type: 'status',
      id: 'analysis-1-status',
      status: 'complete',
      message: 'Analysis finished',
    });

    return 'Analysis complete';
  },
  {
    name: 'analyze_data',
    description: 'Analyze data with progress updates',
    schema: z.object({ query: z.string() }),
  },
);
```

启用 `custom` 流模式以接收这些事件：

```ts
const stream = await graph.stream(
  { messages: langchainMessages },
  { streamMode: ['values', 'messages', 'custom'] },
);
```

**自定义数据行为：**

- 带 `id` 的数据为**持久**（加入 `message.parts` 用于渲染）
- 无 `id` 的数据为**瞬态**（仅通过 `onData` 回调传递）
- `type` 字段决定事件名：`{ type: 'progress' }` → `data-progress`

### LangSmith 部署 Transport

在浏览器中使用 AI SDK `useChat` 与 `LangSmithDeploymentTransport` 直接连接 LangGraph 部署：

```tsx
import { useChat } from 'ai/react';
import { LangSmithDeploymentTransport } from '@ai-sdk/langchain';
import { useMemo } from 'react';

function Chat() {
  const transport = useMemo(
    () =>
      new LangSmithDeploymentTransport({
        url: 'https://your-deployment.us.langgraph.app',
        apiKey: process.env.LANGSMITH_API_KEY,
      }),
    [],
  );

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    transport,
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.parts.map(part => part.text).join('')}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## API 参考

### `toBaseMessages(messages)`

将 AI SDK `UIMessage` 转为 LangChain `BaseMessage`。

**参数：**

- `messages`：`UIMessage[]` - AI SDK UI 消息数组

**返回：** `Promise<BaseMessage[]>`

### `convertModelMessages(modelMessages)`

将 AI SDK `ModelMessage` 转为 LangChain `BaseMessage`。

**参数：**

- `modelMessages`：`ModelMessage[]` - 模型消息数组

**返回：** `BaseMessage[]`

### `toUIMessageStream(stream, callbacks?)`

将 LangChain/LangGraph 流转为 AI SDK `UIMessageStream`。

**参数：**

- `stream`：`AsyncIterable | ReadableStream` - 来自 LangChain `model.stream()`、LangGraph `graph.stream()` 或 `streamEvents()` 的流
- `callbacks?`：`StreamCallbacks<TState>` - 可选生命周期回调：
  - `onStart()` - 流初始化时调用
  - `onToken(token)` - 每个 token 时调用
  - `onText(text)` - 每个文本块时调用
  - `onFinal(text)` - 聚合文本时调用（成功、错误或中止）
  - `onFinish(state)` - 成功时携带 LangGraph 状态（其他流为 `undefined`）
  - `onError(error)` - 流出错时调用
  - `onAbort()` - 流中止时调用

**Returns:** `ReadableStream<UIMessageChunk>`

**支持的流类型：**

- **模型流** - 来自 `model.stream()` 的 `AIMessageChunk` 流
- **LangGraph 流** - `streamMode: ['values', 'messages']` 的流
- **streamEvents** - 来自 `agent.streamEvents()` 或 `model.streamEvents()` 的事件流

**支持的 LangGraph 流事件：**

- `messages` - 流式消息块（文本、工具调用）
- `values` - 完成待处理消息块的状态更新
- `custom` - 自定义数据事件（以 `data-{type}` 块发出）

**支持的 streamEvents 事件：**

- `on_chat_model_stream` - Token streaming from chat models
- `on_tool_start` - Tool execution start
- `on_tool_end` - Tool execution end with output

### `LangSmithDeploymentTransport`

面向 LangSmith/LangGraph 部署的 `ChatTransport` 实现。

**构造参数：**

- `options`：`LangSmithDeploymentTransportOptions` - RemoteGraph 连接配置
  - `url`：`string` - LangSmith 部署 URL 或本地服务器 URL
  - `apiKey?`：`string` - 身份验证 API Key（本地开发可选）
  - `graphId?`：`string` - 要连接的图 ID（默认 `'agent'`）

**实现：** `ChatTransport`

## 文档

更多信息请参阅 [AI SDK 文档](https://ai-sdk.dev)。
