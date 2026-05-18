---
name: add-provider-package
description: 向 AI SDK 添加新 AI provider 包的指南。在创建新的 @ai-sdk/<provider> 包以将 AI 服务集成到 SDK 时使用。
metadata:
  internal: true
---

## 添加新 Provider 包

本指南涵盖创建新的 `@ai-sdk/<provider>` 包以将 AI 服务集成到 AI SDK 的流程。

## 官方包与第三方包

- **第三方包**：任何 provider 都可创建第三方包。我们乐意在文档中链接。
- **官方 `@ai-sdk/<provider>` 包**：若你希望官方包，请先创建 issue 讨论。

## 参考示例

添加新 provider 的完整示例见 https://github.com/vercel/ai/pull/8136/files。

## Provider 架构

AI SDK 采用分层 provider 架构，遵循适配器模式：

1. **Specifications**（`@ai-sdk/provider`）：定义如 `LanguageModelV4`、`EmbeddingModelV4` 等接口
2. **Utilities**（`@ai-sdk/provider-utils`）：实现 provider 的共享代码
3. **Providers**（`@ai-sdk/<provider>`）：各 AI 服务的具体实现
4. **Core**（`ai`）：如 `generateText`、`streamText`、`generateObject` 等高层函数

## 分步指南

### 1. 创建包结构

在 `packages/<provider>` 创建新文件夹，结构如下：

```
packages/<provider>/
├── src/
│   ├── index.ts                  # Main exports
│   ├── version.ts                # Package version
│   ├── <provider>-provider.ts    # Provider implementation
│   ├── <provider>-provider.test.ts
│   ├── <provider>-*-options.ts   # Model-specific options
│   └── <provider>-*-model.ts     # Model implementations (e.g., language, embedding, image)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsup.config.ts
├── turbo.json
├── vitest.node.config.js
├── vitest.edge.config.js
└── README.md
```

不要创建 `CHANGELOG.md` 文件。它将自动生成。

### 2. 配置 package.json

设置 `package.json`：

- `"name": "@ai-sdk/<provider>"`
- `"version": "0.0.0"`（初始版本，由 changeset 更新）
- `"license": "Apache-2.0"`
- `"sideEffects": false`
- 依赖 `@ai-sdk/provider` 与 `@ai-sdk/provider-utils`（使用 `workspace:*`）
- 开发依赖：`@ai-sdk/test-server`、`@types/node`、`@vercel/ai-tsconfig`、`tsup`、`typescript`、`zod`
- `"engines": { "node": ">=18" }`
- `zod` 的 peer dependency（v3 与 v4）：`"zod": "^3.25.76 || ^4.1.8"`

exports 配置示例：

```json
{
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

### 3. 创建 TypeScript 配置

**tsconfig.json**:

```json
{
  "extends": "@vercel/ai-tsconfig/base.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**tsconfig.build.json**:

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "**/*.test.ts",
    "**/*.test-d.ts",
    "**/__snapshots__",
    "**/__fixtures__"
  ]
}
```

### 4. 配置构建工具（tsup）

创建 `tsup.config.ts`：

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

### 5. 配置测试运行器

创建 `vitest.node.config.js` 与 `vitest.edge.config.js`（从现有 provider 如 `anthropic` 复制）。

### 6. 实现 Provider

**Provider 实现模式**：

```typescript
// <provider>-provider.ts
import { NoSuchModelError } from '@ai-sdk/provider';
import { loadApiKey } from '@ai-sdk/provider-utils';

export interface ProviderSettings {
  apiKey?: string;
  baseURL?: string;
  // provider-specific settings
}

export class ProviderInstance {
  readonly apiKey?: string;
  readonly baseURL?: string;

  constructor(options: ProviderSettings = {}) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL;
  }

  private get baseConfig() {
    return {
      apiKey: () =>
        loadApiKey({
          apiKey: this.apiKey,
          environmentVariableName: 'PROVIDER_API_KEY',
          description: 'Provider API key',
        }),
      baseURL: this.baseURL ?? 'https://api.provider.com',
    };
  }

  languageModel(modelId: string) {
    return new ProviderLanguageModel(modelId, this.baseConfig);
  }

  // Shorter alias
  chat(modelId: string) {
    return this.languageModel(modelId);
  }
}

// Export default instance
export const providerName = new ProviderInstance();
```

### 7. 实现 Model 类

每种 model 类型（language、embedding、image 等）应实现 `@ai-sdk/provider` 中的相应接口：

- 文本生成 model 使用 `LanguageModelV4`
- 嵌入 model 使用 `EmbeddingModelV4`
- 图像生成 model 使用 `ImageModelV4`
- 等

**Schema 指南**：

**Provider Options**（面向用户）：

- 除非 `null` 有明确语义，否则使用 `.optional()`
- 尽量严格以保留未来灵活性

**Response Schemas**（API 响应）：

- 使用 `.nullish()` 而非 `.optional()`
- 保持精简——只包含所需属性
- 为 provider API 变更留出余地

### 8. 创建 README.md

包含：

- 链接到文档的简要描述
- 安装说明
- 基础用法示例
- 完整文档链接

### 9. 编写测试

- Provider 逻辑的单元测试
- 使用 `__fixtures__` 子目录中 fixture 的 API 响应解析测试
- Node.js 与 Edge 运行时测试

捕获真实 API 响应用于测试见 `capture-api-response-test-fixture` skill。

### 10. 添加示例

在 `examples/ai-functions/src/` 为 provider 支持的每种 model 类型创建示例：

- `generate-text/<provider>.ts` - 基础文本生成
- `stream-text/<provider>.ts` - 流式文本
- `generate-object/<provider>.ts` - 结构化输出（若支持）
- `stream-object/<provider>.ts` - 流式结构化输出（若支持）
- `embed/<provider>.ts` - 嵌入（若支持）
- `generate-image/<provider>.ts` - 图像生成（若支持）
- 等

按需添加功能专用示例（例如 `<provider>-tool-call.ts`、`<provider>-cache-control.ts`）。

### 11. 添加文档

在 `content/providers/01-ai-sdk-providers/<last number + 10>-<provider>.mdx` 创建文档

包含：

- 设置说明
- 可用 model
- Model 能力
- Provider 专用 options
- 用法示例
- API 配置

### 12. 创建 Changeset

运行 `pnpm changeset` 并：

- 选择新 provider 包
- 选择 `major` 版本（新包从 0.0.0 开始）
- 描述包提供的功能

### 13. 更新 References

在 workspace 根目录运行 `pnpm update-references` 以更新 tsconfig references。

### 14. 构建与测试

```bash
# From workspace root
pnpm build

# From provider package
cd packages/<provider>
pnpm test              # Run all tests
pnpm test:node         # Run Node.js tests
pnpm test:edge         # Run Edge tests
pnpm type-check        # Type checking

# From workspace root
pnpm type-check:full   # Full type check including examples
```

### 15. 运行示例

测试你的示例：

```bash
cd examples/ai-functions
pnpm tsx src/generate-text/<provider>.ts
pnpm tsx src/stream-text/<provider>.ts
```

## Provider 方法命名

- **完整名称**：`languageModel(id)`、`imageModel(id)`、`embeddingModel(id)`（必需）
- **短别名**：`.chat(id)`、`.image(id)`、`.embedding(id)`（提升 DX）

## 文件命名约定

- 源文件：`kebab-case.ts`
- 测试文件：`kebab-case.test.ts`
- 类型测试文件：`kebab-case.test-d.ts`
- Provider 类：`<Provider>Provider`、`<Provider>LanguageModel` 等

## 安全最佳实践

- 切勿直接使用 `JSON.parse`——使用 `@ai-sdk/provider-utils` 的 `parseJSON` 或 `safeParseJSON`
- 使用 `@ai-sdk/provider-utils` 的 `loadApiKey` 安全加载 API key
- 根据 schema 验证所有 API 响应

## 错误处理

错误应继承 `@ai-sdk/provider` 的 `AISDKError` 并使用 marker 模式：

```typescript
import { AISDKError } from '@ai-sdk/provider';

const name = 'AI_ProviderError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class ProviderError extends AISDKError {
  private readonly [symbol] = true;

  constructor({ message, cause }: { message: string; cause?: unknown }) {
    super({ name, message, cause });
  }

  static isInstance(error: unknown): error is ProviderError {
    return AISDKError.hasMarker(error, marker);
  }
}
```

## 预发布模式

若 `main` 已配置为发布 `beta` 版本，无需额外操作。仅注意不要将其 backport 到 `vX.Y` 稳定分支，否则在 `main` 退出预发布模式后会导致 npm 版本冲突。

## 检查清单

- [ ] 在 `packages/<provider>` 创建包结构
- [ ] `package.json` 配置正确依赖
- [ ] 设置 TypeScript 配置（`tsconfig.json`、`tsconfig.build.json`）
- [ ] 构建配置（`tsup.config.ts`）
- [ ] 测试配置（`vitest.node.config.js`、`vitest.edge.config.js`）
- [ ] Provider 实现完成
- [ ] Model 类实现相应接口
- [ ] 单元测试编写并通过
- [ ] 捕获 API 响应测试 fixture
- [ ] 在 `examples/ai-functions/src/` 创建示例
- [ ] 在 `content/providers/01-ai-sdk-providers/` 添加文档
- [ ] 编写 README.md
- [ ] 创建 major changeset
- [ ] 运行 `pnpm update-references`
- [ ] 全部测试通过（在包目录运行 `pnpm test`）
- [ ] 类型检查通过（在根目录运行 `pnpm type-check:full`）
- [ ] 示例运行成功

## 常见问题

- **缺少 tsconfig references**：在 workspace 根目录运行 `pnpm update-references`
- **示例中的类型错误**：运行 `pnpm type-check:full` 尽早发现
- **测试失败**：确保 Node 与 Edge 测试均通过
- **构建错误**：检查 `tsup.config.ts` 配置是否正确

## 相关文档

- [Provider Architecture](../../contributing/provider-architecture.md)
- [Provider Development Notes](../../contributing/providers.md)
- [Develop AI Functions Example](../develop-ai-functions-example/SKILL.md)
- [Capture API Response Test Fixture](../capture-api-response-test-fixture/SKILL.md)
