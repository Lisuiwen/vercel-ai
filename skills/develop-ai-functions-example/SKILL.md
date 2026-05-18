---
name: develop-ai-functions-example
description: 开发 AI SDK function 的示例。在 examples/ai-functions/src 下创建、运行或修改示例以验证 provider 支持、演示功能或创建测试 fixture 时使用。
metadata:
  internal: true
---

## AI Functions 示例

`examples/ai-functions/` 目录包含用于验证、测试与迭代各 provider 上 AI SDK function 的脚本。

## 示例分类

示例按 AI SDK function 组织在 `examples/ai-functions/src/`：

| Directory          | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `generate-text/`   | 使用 `generateText()` 的非流式文本生成               |
| `stream-text/`     | 使用 `streamText()` 的流式文本生成                   |
| `generate-object/` | 使用 `generateObject()` 的结构化输出生成             |
| `stream-object/`   | 使用 `streamObject()` 的流式结构化输出               |
| `agent/`           | 用于 agentic 工作流的 `ToolLoopAgent` 示例           |
| `embed/`           | 使用 `embed()` 的单条嵌入                            |
| `embed-many/`      | 使用 `embedMany()` 的批量嵌入                        |
| `generate-image/`  | 使用 `generateImage()` 的图像生成                    |
| `generate-speech/` | 使用 `generateSpeech()` 的文本转语音                 |
| `transcribe/`      | 使用 `transcribe()` 的音频转写                       |
| `rerank/`          | 使用 `rerank()` 的文档重排序                         |
| `middleware/`      | 自定义 middleware 实现                               |
| `registry/`        | Provider registry 设置与用法                         |
| `telemetry/`       | OpenTelemetry 集成                                   |
| `complex/`         | 多组件示例（agent、router）                          |
| `lib/`             | 共享工具（非示例）                                   |
| `tools/`           | 可复用的 tool 定义                                   |

## 文件命名约定

示例遵循模式：`{provider}-{feature}.ts`

| Pattern                                  | Example                                    | Description                |
| ---------------------------------------- | ------------------------------------------ | -------------------------- |
| `{provider}.ts`                          | `openai.ts`                                | 基础 provider 用法         |
| `{provider}-{feature}.ts`                | `openai-tool-call.ts`                      | 特定功能                   |
| `{provider}-{sub-provider}.ts`           | `amazon-bedrock-anthropic.ts`              | 带子 provider 的 provider  |
| `{provider}-{sub-provider}-{feature}.ts` | `google-vertex-anthropic-cache-control.ts` | 子 provider 与功能         |

## 示例结构

所有示例使用 `lib/run.ts` 中的 `run()` 包装器，它会：

- 从 `.env` 加载环境变量
- 提供带详细 API 错误日志的错误处理

### 基础模板

```typescript
import { providerName } from '@ai-sdk/provider-name';
import { generateText } from 'ai';
import { run } from '../lib/run';

run(async () => {
  const result = await generateText({
    model: providerName('model-id'),
    prompt: 'Your prompt here.',
  });

  console.log(result.text);
  console.log('Token usage:', result.usage);
  console.log('Finish reason:', result.finishReason);
});
```

### 流式模板

```typescript
import { providerName } from '@ai-sdk/provider-name';
import { streamText } from 'ai';
import { printFullStream } from '../lib/print-full-stream';
import { run } from '../lib/run';

run(async () => {
  const result = streamText({
    model: providerName('model-id'),
    prompt: 'Your prompt here.',
  });

  await printFullStream({ result });
});
```

### Tool Calling 模板

```typescript
import { providerName } from '@ai-sdk/provider-name';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { run } from '../lib/run';

run(async () => {
  const result = await generateText({
    model: providerName('model-id'),
    tools: {
      myTool: tool({
        description: 'Tool description',
        inputSchema: z.object({
          param: z.string().describe('Parameter description'),
        }),
        execute: async ({ param }) => {
          return { result: `Processed: ${param}` };
        },
      }),
    },
    prompt: 'Use the tool to...',
  });

  console.log(JSON.stringify(result, null, 2));
});
```

### 结构化输出模板

```typescript
import { providerName } from '@ai-sdk/provider-name';
import { generateObject } from 'ai';
import { z } from 'zod';
import { run } from '../lib/run';

run(async () => {
  const result = await generateObject({
    model: providerName('model-id'),
    schema: z.object({
      name: z.string(),
      items: z.array(z.string()),
    }),
    prompt: 'Generate a...',
  });

  console.log(JSON.stringify(result.object, null, 2));
  console.log('Token usage:', result.usage);
});
```

## 运行示例

在 `examples/ai-functions` 目录：

```bash
pnpm tsx src/generate-text/openai.ts
pnpm tsx src/stream-text/openai-tool-call.ts
pnpm tsx src/agent/openai-generate.ts
```

## 何时编写示例

在以下情况编写示例：

1. **添加新 provider**：为每个支持的 API 创建基础示例（`generateText`、`streamText`、`generateObject` 等）

2. **实现新功能**：至少用一个 provider 示例演示该功能

3. **复现 bug**：创建展示问题的示例以便调试

4. **添加 provider 专用 options**：展示如何使用 `providerOptions` 配置 provider 专用设置

5. **创建测试 fixture**：用示例生成 API 响应 fixture（见 `capture-api-response-test-fixture` skill）

## 工具 Helper

`lib/` 目录包含共享工具：

| File                   | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `run.ts`               | 带 `.env` 加载的错误处理包装器                           |
| `print.ts`             | 清晰打印对象（移除 undefined 值）                        |
| `print-full-stream.ts` | tool call、reasoning、文本的彩色流式输出                 |
| `save-raw-chunks.ts`   | 保存流式 chunk 用于测试 fixture                          |
| `present-image.ts`     | 在终端显示图像                                           |
| `save-audio.ts`        | 将音频文件保存到磁盘                                     |

### 使用 print 工具

```typescript
import { print } from '../lib/print';

// Pretty print objects without undefined values
print('Result:', result);
print('Usage:', result.usage, { depth: 2 });
```

### 使用 printFullStream

```typescript
import { printFullStream } from '../lib/print-full-stream';

const result = streamText({ ... });
await printFullStream({ result }); // Colored output for text, tool calls, reasoning
```

## 可复用 Tools

`tools/` 目录包含可复用的 tool 定义：

```typescript
import { weatherTool } from '../tools/weather-tool';

const result = await generateText({
  model: openai('gpt-4o'),
  tools: { weather: weatherTool },
  prompt: 'What is the weather in San Francisco?',
});
```

## 最佳实践

1. **保持示例聚焦**：每个示例应演示一个功能或用例

2. **使用描述性 prompt**：清楚说明示例在测试什么

3. **优雅处理错误**：`run()` 包装器会自动处理

4. **使用真实的 model ID**：使用 provider 实际可用的 model ID

5. **为复杂逻辑添加注释**：解释非显而易见的代码模式

6. **适当复用 tool**：使用 `weatherTool` 或在 `tools/` 中创建新的可复用 tool
