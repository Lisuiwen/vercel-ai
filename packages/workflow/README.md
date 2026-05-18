# @ai-sdk/workflow

WorkflowAgent 用于构建可在工作流步骤间保持状态、调用工具并优雅处理中断的持久化 AI Agent。

## 安装

```bash
npm install @ai-sdk/workflow ai
```

## 用法

```typescript
import { WorkflowAgent } from '@ai-sdk/workflow';
import { z } from 'zod';

const agent = new WorkflowAgent({
  model: 'anthropic/claude-opus',
  tools: {
    getWeather: {
      description: 'Get weather for a location',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => {
        // Fetch weather data
        return { temperature: 72, condition: 'sunny' };
      },
    },
  },
  system: 'You are a helpful weather assistant.',
});

const result = await agent.stream({
  messages: [{ role: 'user', content: 'What is the weather in SF?' }],
  writable: new WritableStream({
    write(chunk) {
      console.log('Chunk:', chunk);
    },
  }),
});

console.log('Final messages:', result.messages);
console.log('Steps:', result.steps);
```

## 功能

- **流式支持**： 实时流式返回响应
- **工具调用**： 在对话中动态执行工具
- **上下文管理**： 在步骤间传递上下文
- **错误处理**： 通过回调进行健壮错误处理
- **结构化输出**： 解析 LLM 响应中的结构化输出
- **步骤回调**： 挂接到 Agent 循环的每一步
- **提供商执行的工具**： 支持由提供商执行的工具
- **中止支持**： 通过 AbortSignal 取消操作

## API

完整 API 说明见 [AI SDK 文档](https://ai-sdk.dev/docs)。

## 许可证

Apache-2.0
