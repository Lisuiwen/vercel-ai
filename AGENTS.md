# AGENTS.md

本文件为在 Vercel AI SDK 仓库中工作的 AI 编程助手（Cursor、GitHub Copilot、Claude Code 等）提供上下文。

## 项目概览

Vercel 的 **AI SDK** 是一个用于基于大语言模型（LLM）构建 AI 应用的 TypeScript/JavaScript SDK。它为多种 AI 提供商和框架集成提供统一接口。

- **Repository**: https://github.com/vercel/ai
- **Documentation**: https://ai-sdk.dev/docs
- **License**: Apache-2.0

## 仓库结构

这是一个使用 pnpm workspaces 和 Turborepo 的 **monorepo**。

### 关键目录

| Directory                 | Description                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `packages/ai`             | 主 SDK 包（npm 上的 `ai`）                                                           |
| `packages/provider`       | Provider 接口规范（`@ai-sdk/provider`）                                              |
| `packages/provider-utils` | 供 provider 与核心共用的工具（`@ai-sdk/provider-utils`）                             |
| `packages/<provider>`     | AI provider 实现（openai、anthropic、google、azure、amazon-bedrock 等）              |
| `packages/<framework>`    | UI 框架集成（react、vue、svelte、angular、rsc）                                        |
| `packages/codemod`        | 主版本发布的自动化迁移                                                               |
| `examples/`               | 示例应用（ai-functions、next-openai 等）                                             |
| `content/`                | 文档源文件（MDX）                                                                    |
| `contributing/`           | 贡献者指南与文档                                                                     |
| `tools/`                  | 内部工具（tsconfig）                                                                 |

### 核心包依赖关系

```
ai ─────────────────┬──▶ @ai-sdk/provider-utils ──▶ @ai-sdk/provider
                    │
@ai-sdk/<provider> ─┴──▶ @ai-sdk/provider-utils ──▶ @ai-sdk/provider
```

## 开发环境设置

### 要求

- **Node.js**：v18、v20 或 v22（开发推荐 v22）
- **pnpm**：v10+（`npm install -g pnpm@10`）

### 初始设置

```bash
pnpm install        # Install all dependencies
pnpm build          # Build all packages
```

## 开发命令

### 根目录命令

| Command                  | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `pnpm install`           | 安装依赖                                                          |
| `pnpm build`             | 构建所有包                                                        |
| `pnpm test`              | 运行全部测试（不含 examples）                                     |
| `pnpm check`             | 运行 lint（oxlint）与格式化（oxfmt）检查                          |
| `pnpm fix`               | 修复 lint 与格式化问题                                            |
| `pnpm type-check:full`   | TypeScript 类型检查（含 examples）                                |
| `pnpm changeset`         | 为 PR 添加 changeset                                              |
| `pnpm update-references` | 添加包依赖后更新 tsconfig.json references                         |

### 包级命令

在包目录内执行（例如 `packages/ai`）：

| Command            | Description                 |
| ------------------ | --------------------------- |
| `pnpm build`       | 构建该包                    |
| `pnpm build:watch` | 监听模式构建                |
| `pnpm test`        | 运行全部测试（node + edge） |
| `pnpm test:node`   | 仅运行 Node.js 测试         |
| `pnpm test:edge`   | 仅运行 Edge 运行时测试      |
| `pnpm test:watch`  | 监听模式运行测试            |

### 运行示例

```bash
cd examples/ai-functions
pnpm tsx src/stream-text/openai/basic.ts    # Run a specific example
```

### AI Functions 示例布局

- 将示例放在 `examples/ai-functions/src/<function>/<provider>/` 下
- 使用 `basic.ts` 作为该 provider 的入口示例文件
- 其余示例放在同一 provider 文件夹内，文件名使用描述性的 `kebab-case`
- 不要创建扁平的顶层 provider 文件，例如 `src/stream-text/openai.ts`

## 核心 API

| Function                   | Purpose                    | Package |
| -------------------------- | -------------------------- | ------- |
| `generateText`             | 生成文本补全               | `ai`    |
| `streamText`               | 流式文本补全               | `ai`    |
| `generateObject`           | 生成结构化输出             | `ai`    |
| `streamObject`             | 流式结构化输出             | `ai`    |
| `embed` / `embedMany`      | 生成嵌入向量               | `ai`    |
| `generateImage`            | 生成图像                   | `ai`    |
| `tool`                     | 定义 tool                  | `ai`    |
| `jsonSchema` / `zodSchema` | 定义 schema                | `ai`    |

## 导入模式

| What                                          | Import From                                   |
| --------------------------------------------- | --------------------------------------------- |
| Core functions (`generateText`, `streamText`) | `ai`                                          |
| Tool/schema utilities (`tool`, `jsonSchema`)  | `ai`                                          |
| Provider implementations                      | `@ai-sdk/<provider>` (e.g., `@ai-sdk/openai`) |
| Error classes                                 | `ai` (re-exports from `@ai-sdk/provider`)     |
| Provider type interfaces (`LanguageModelV4`)  | `@ai-sdk/provider`                            |
| Provider implementation utilities             | `@ai-sdk/provider-utils`                      |

## 编码规范

### 格式化

- **Formatter**：oxfmt（通过 `pnpm fix` 或 `ultracite fix`）
- **Linter**：oxlint（通过 `pnpm check` 或 `ultracite check`）
- **Config**：`.oxfmtrc.jsonc`（formatter）与 `.oxlintrc.json`（linter）
- **Pre-commit hook**：若暂存了 `package.json` 变更，会运行 `pnpm install`

### 测试

- **Framework**：Vitest
- **Test files**：与源文件同目录的 `*.test.ts`
- **Type tests**：类型级测试使用 `*.test-d.ts`
- **Fixtures**：存放在 `__fixtures__` 子文件夹
- **Snapshots**：存放在 `__snapshots__` 子文件夹

### Zod 用法

SDK 同时支持 Zod 3 与 Zod 4。请使用正确的导入：

```typescript
// For Zod 3 (compatibility code only)
import * as z3 from 'zod/v3';

// For Zod 4
import * as z4 from 'zod/v4';
// Use z4.core.$ZodType for type references
```

### JSON 解析

生产代码中切勿直接使用 `JSON.parse`，以避免安全风险。
请改用 `@ai-sdk/provider-utils` 中的 `parseJSON` 或 `safeParseJSON`。

### 类型检查

修改代码后务必运行类型检查：

```bash
pnpm type-check:full    # Run from workspace root
```

这可确保变更不会在代码库（含 examples）中引入类型错误。

### 文件命名约定

- 源文件：`kebab-case.ts`
- 测试文件：`kebab-case.test.ts`
- 类型测试文件：`kebab-case.test-d.ts`
- React/UI 组件：`kebab-case.tsx`

## 错误模式

错误类继承自 `@ai-sdk/provider` 的 `AISDKError`，并使用 marker 模式以支持 `instanceof` 检查：

```typescript
import { AISDKError } from '@ai-sdk/provider';

const name = 'AI_MyError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class MyError extends AISDKError {
  private readonly [symbol] = true; // used in isInstance

  constructor({ message, cause }: { message: string; cause?: unknown }) {
    super({ name, message, cause });
  }

  static isInstance(error: unknown): error is MyError {
    return AISDKError.hasMarker(error, marker);
  }
}
```

## 架构决策记录（ADR）

本仓库在 `contributing/decisions/` 中使用 ADR 记录重要架构决策。在涉及架构的变更（新依赖、新模式、API 设计、基础设施）之前，请先查阅现有 ADR：

1. 阅读 `contributing/decisions/README.md` 获取决策索引。
2. 阅读与你工作领域相关的已接受 ADR，并遵循其中规定的决策与实现模式。
3. 若遇到某种代码模式并疑惑「为何如此实现」，先查是否有 ADR 说明。
4. 若你的工作将与已接受的 ADR 矛盾，请先停止并与维护者讨论再继续。

若要提议或创建新 ADR，请使用 ADR skill。

## 项目理念

关于指导决策的关键项目理念概览，见 `contributing/project-philosophies.md`。

## 架构

### Provider 模式

SDK 采用分层 provider 架构，遵循适配器模式：

1. **Specifications**（`@ai-sdk/provider`）：定义如 `LanguageModelV4` 等接口
2. **Utilities**（`@ai-sdk/provider-utils`）：实现 provider 的共享代码
3. **Providers**（`@ai-sdk/<provider>`）：各 AI 服务的具体实现
4. **Core**（`ai`）：如 `generateText`、`streamText`、`generateObject` 等高层函数

关于 AI 函数、模型规范与 provider 实现的概念性说明，见 `architecture/provider-abstraction.md`。

### Provider 开发

**Provider Options Schemas**（面向用户）：

- 除非 `null` 有明确语义，否则使用 `.optional()`
- 尽量严格，以便未来保留灵活性

**Response Schemas**（API 响应）：

- 使用 `.nullish()` 而非 `.optional()`
- 保持精简——只包含所需属性
- 为 provider API 变更留出余地

### 添加新包

1. 在 `packages/<name>` 下创建文件夹
2. 添加到根 `tsconfig.json` 的 references
3. 若在包之间添加依赖，运行 `pnpm update-references`

## 贡献指南

| Task                  | Guide                                   |
| --------------------- | --------------------------------------- |
| Add new provider      | `contributing/add-new-provider.md`      |
| Add new model         | `contributing/add-new-model.md`         |
| Testing & fixtures    | `contributing/testing.md`               |
| Provider architecture | `contributing/provider-architecture.md` |
| Building new features | `contributing/building-new-features.md` |
| Codemods              | `contributing/codemods.md`              |

## Changesets

- **Required**：修改生产代码的每个 PR 都需要 changeset
- **Default**：使用 `patch`（非破坏性变更）
- **Command**：在 workspace 根目录运行 `pnpm changeset`
- **Note**：不要选择 example 包——它们不会发布

## 任务完成指南

以下指南说明不同类型任务通常应交付的产出物。请根据范围与上下文灵活调整。

### Bug 修复

完整的 bug 修复通常包括：

1. **Reproduction example**：在修复前于 `examples/` 中创建/更新能复现 bug 的示例
2. **Unit tests**：添加若无修复则会失败的测试（回归测试）
3. **Implementation**：修复 bug
4. **Manual verification**：运行复现示例确认修复有效
5. **Changeset**：说明破坏了什么以及如何修复

### 新功能

完整的功能通常包括：

1. **Implementation**：实现功能
2. **Examples**：在 `examples/` 中添加演示该功能的用法示例
3. **Unit tests**：为新功能编写充分测试
4. **Documentation**：为公开 API 更新 `content/` 中的相关文档
5. **Changeset**：在发布说明中描述该功能

### 重构 / 内部变更

- 为任何行为变更编写单元测试
- 仅内部变更无需文档
- 仅当影响已发布包时才需要 changeset

### 何时可偏离

以上为指南而非硬性规则。可根据以下因素调整：

- **Scope**：琐碎修复（错别字、注释）可能不需要示例
- **Visibility**：内部变更可能不需要文档
- **Context**：部分变更横跨多个类别

若不确定应交付哪些产出物，请询问以澄清。

## 禁止事项

- 添加 minor/major changesets
- 在未更新文档的情况下变更公开 API
- 使用 `require()` 导入
- 在未运行 `pnpm update-references` 的情况下添加新依赖
- 作为更大范围代码库变更的一部分修改 `content/docs/08-migration-guides` 或 `packages/codemod`
