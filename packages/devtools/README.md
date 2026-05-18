# AI SDK DevTools

用于调试与检查 AI SDK 应用的本地开发工具。在 Web UI 中查看 LLM 请求、响应、工具调用与多步交互。

> **注意**：本包为实验性，仅用于本地开发。请勿在生产环境使用。

## 安装

```bash
npm install @ai-sdk/devtools
# or
pnpm add @ai-sdk/devtools
```

## 要求

- AI SDK v6 beta（`ai@^6.0.0-beta.0`）
- 兼容 Node.js 的运行时

## 用法

### 1. 为模型添加中间件

```typescript
import { wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const model = wrapLanguageModel({
  middleware: devToolsMiddleware(),
  model: yourModel,
});
```

### 2. 运行查看器

```bash
npx @ai-sdk/devtools
```

打开 http://localhost:4983 查看 AI SDK 交互。

## 工作原理

中间件拦截所有 `generateText` 与 `streamText` 调用，并捕获：

- 输入参数与 prompt
- 输出内容与工具调用
- Token 用量与耗时
- 原始提供商请求/响应数据

数据保存在本地 JSON 文件（`.devtools/generations.json`）中，并通过 Web UI 展示。

### 数据流

```
AI SDK call → devToolsMiddleware → JSON file → Hono API → React UI
```

### 核心概念

- **Run**：按初始 prompt 分组的多步完整 AI 交互
- **Step**：一次 Run 内的单次 LLM 调用

## 开发

```bash
pnpm install
pnpm dev        # Start dev server at http://localhost:5173
```

## 许可证

MIT
