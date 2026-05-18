# LangGraph 开发服务器

用于配合 `@ai-sdk/langchain` 适配器进行本地开发与测试的简单 LangGraph Agent。

## 安装

1. 安装依赖：

   ```bash
   pnpm install
   ```

1. 创建 `.env` 并设置 OpenAI API Key：

   ```bash
   OPENAI_API_KEY=your-openai-api-key
   ```

1. 启动开发服务器：

   ```bash
   pnpm dev
   # Or directly:
   npx @langchain/langgraph-cli dev
   ```

服务器将在 `http://localhost:2024` 启动。

> **注意：** 在父目录执行 `pnpm dev` 运行完整示例时，Next.js 与本 LangGraph 服务器会自动启动。

## 可用工具

Agent 包含两个工具：

- **get_weather**：返回指定城市的模拟天气数据
- **calculator**：执行基础数学计算

## 自定义 Agent

本示例为简便使用 LangChain 的 `createAgent`。LangGraph CLI 可托管**任意** LangGraph 应用，包括：

- 使用 `createAgent` 的**简单 Agent**（如本示例）
- 自定义 `StateGraph` 的**复杂多 Agent 工作流**
- 带检索节点的 **RAG 流水线**
- 带中断点的 **Human-in-the-loop 工作流**
- 带持久化与记忆的**自定义图**

更高级场景可使用底层 LangGraph API：

```typescript
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('agent', callModel)
  .addNode('tools', new ToolNode(tools))
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent');

export const graph = workflow.compile();
```

更多示例见 [LangGraph 文档](https://langchain-ai.github.io/langgraph/)。

## 与 AI SDK 配合使用

在前端使用 `LangSmithDeploymentTransport` 连接本服务器：

```typescript
import { LangSmithDeploymentTransport } from '@ai-sdk/langchain';
import { useChat } from '@ai-sdk/react';

const transport = new LangSmithDeploymentTransport({
  url: 'http://localhost:2024',
});

function Chat() {
  const { messages, sendMessage } = useChat({ transport });
  // ...
}
```

## 配置

`langgraph.json` 用于配置 LangGraph CLI：

```json
{
  "graphs": {
    "agent": "./src/agent.ts:graph"
  },
  "env": ".env"
}
```
