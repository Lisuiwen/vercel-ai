---
name: update-provider-models
description: 为现有 AI SDK provider 添加新 model ID 或移除过时 model ID。在向 provider 添加 model、移除过时 model、或处理 issue 中的 model 变更列表时使用。触发词："add model"、"remove model"、"new model ID"、"obsolete model"、"update model IDs"。
metadata:
  internal: true
---

## 更新 Provider Model ID

本 skill 涵盖在 AI SDK 代码库中添加新 model ID 与移除过时 model ID。每个工作流使用搜索发现所有需要变更的位置。

你可能被要求添加或移除单个 model ID，或处理 issue 中的多个 model ID 变更列表。对每个 model ID，遵循相应工作流：

- 若正在添加新 model ID，遵循 `<adding-new-model>` 工作流。
- 若正在移除过时 model ID，遵循 `<removing-obsolete-model>` 工作流。

## 关键规则

- **精确匹配**：Model ID 常为其他 ID 的子串（例如 `grok-3` 与 `grok-3-mini`）。始终验证每个搜索结果是否为精确 model，而非子串匹配。
- **尊重排序**：向任何列表（类型联合、表格行、数组）插入时，观察现有顺序并相应放置新条目。
- **示例文件命名**：使用 kebab-case，点替换为连字符（例如 `gpt-5.4-codex` → `gpt-5-4-codex.ts`）。
- **顺序处理**：处理多个 model 时，完成一个 model 的完整工作流后再开始下一个。
- **受影响的 provider**：新 model ID 始终需要添加到主 provider 包与 AI Gateway。若 model 在 Bedrock、Vertex、OpenAI-compatible 等可用或在测试/文档中被引用，可能还需更新其他包。
- **勿做无关变更**：仅更新 model ID 及相关引用。不要修改编辑文件中的其他代码、文本或格式。
- **切勿修改 `packages/codemod` 的 `CHANGELOG.md`**：Changelog 为历史记录，codemod 为迁移脚本。更新 model ID 时不要编辑它们。

<adding-new-model>

## 添加新 Model ID 的工作流

### 步骤 1：确定范围

确定：

- Provider 名称（例如 `anthropic`、`openai`、`google`、`xai`）
- 精确的 model ID 字符串（例如 `claude-haiku-4-5-20260218`、`gemini-3.1-pro`、`gpt-5.4-codex`）
- Model 类型：chat、embedding、image 等
- 这是现有旧 model 的新版本，还是现有 preview 或 experimental model 的稳定版
- 除主 provider 与 AI Gateway 外，是否还需更新其他 provider 包（例如 Bedrock、Vertex、OpenAI-compatible）
  - 若在其他 provider 包中列出了类似 model ID，新 model ID 可能也应添加在那里。查阅 provider 文档以判断可用性。

### 步骤 2：查找类似 Model 的引用位置

在同一 provider 中搜索类似的现有 model（例如较低版本，或被替换的 preview 版本），范围 `packages/`、`content/`、`examples/`。这可揭示所有需要更新的位置。

```bash
# Search quoted occurrences to find all reference locations
grep -r "'<similar-model-id>'" packages/ content/ examples/ --include='*.ts' --include='*.mdx' --include='*.md'
grep -r '"<similar-model-id>"' packages/ content/ examples/ --include='*.ts' --include='*.mdx' --include='*.md'
```

### 步骤 3：更新类型定义

对找到的每个相关 `packages` 文件，将新 model ID 添加到类型联合（及 const 数组，若有），并尊重现有排序。

Model ID 类型定义的常见位置示例：

- `packages/<provider>/src/*-options.ts` — 主 provider 包
- `packages/gateway/src/gateway-language-model-settings.ts` — AI Gateway 包
- `packages/amazon-bedrock/src/**/*-options.ts` — 若 model 在 Amazon Bedrock 可用
- `packages/google-vertex/src/*-options.ts` — 若 model 在 Google Vertex 可用

以上**并非** exhaustive 列表——步骤 2 的搜索可能揭示其他需要更新的 model ID 引用文件。

**切勿**在此处替换 model ID。仅添加新 model ID。将旧或 preview model ID 的引用替换仅与文档和示例相关。

类型联合添加示例：

```typescript
export type SomeModelId =
  | 'existing-model-a'
  | 'new-model-id' // ← add in sorted position
  | 'existing-model-b'
  | (string & {});
```

Const 数组添加示例：

```typescript
export const reasoningModelIds = [
  'existing-model-a',
  'new-model-id', // ← add in sorted position
  'existing-model-b',
] as const;
```

### 步骤 4：更新文档

对 `content/` 中找到的每个 `.mdx` 文件，添加或更新条目：

- **能力表**：在正确位置为新 model 添加一行，使用适当的能力标记（`<Check size={18} />` 或 `<Cross size={18} />`）。
- **内联代码示例**：若将 preview/旧 model 替换为推荐 model，更新如 `const model = provider('old-model')` 的代码片段以使用新 model。
- **「最新」描述**：更新如「具有增强推理的最新 model」的文本以引用新 model。

若在特定包的 `README.md` 中发现类似 model ID 的引用，也更新其中的 model ID 示例。

### 步骤 5：创建或更新示例

**若新 model 替代旧 model**：找到使用旧 model 的现有示例并更新为新 model ID。

**若纯粹新增且无前身**：创建新示例文件，每个与新 model 相关的顶层 function 一个文件（例如 `generateText`、`streamText`、`generateImage`）。例如新 language model：

- `examples/ai-functions/src/generate-text/<provider>/<model-kebab>.ts`
- `examples/ai-functions/src/stream-text/<provider>/<model-kebab>.ts`

或新 image model：

- `examples/ai-functions/src/generate-image/<provider>/<model-kebab>.ts`

在同一文件夹中查找该 provider 的现有示例文件作为参考。

在搜索类似 model ID 时，可能发现 model ID 作为 model 列表一部分的示例（例如测试或示例中的选项数组）。此时在示例文件的同一列表中添加新 model ID，并尊重排序。

### 步骤 6：更新测试

在合理处，将旧或 preview model 的引用替换为新 model，尤其当新 model 现为推荐 model 时。

**例外：** 不要替换 fixture 或 snapshot 中的 model ID，也不要替换使用这些 fixture 或 snapshot 的测试，因为它们应保持稳定并反映捕获的真实 API 响应。

### 步骤 7：运行测试

```bash
pnpm --filter @ai-sdk/<provider> test
pnpm --filter @ai-sdk/gateway test
```

对其他受影响的包也运行测试：

```bash
pnpm --filter @ai-sdk/openai-compatible test  # if snapshots/tests were updated
pnpm --filter @ai-sdk/amazon-bedrock test     # if Bedrock options were updated
pnpm --filter @ai-sdk/google-vertex test      # if Vertex options were updated
```

</adding-new-model>

<removing-obsolete-model>

## 移除过时 Model ID 的工作流

### 步骤 1：确定继任者

确定在示例、测试与文档中哪个 model 替代被移除的 model。这与更新引用相关。

若无明显继任者，应保留示例、文档与测试中的旧引用。

### 步骤 2：查找所有精确出现

用引号搜索 model ID 以避免子串误报：

```bash
# Single-quoted (TypeScript source, type unions)
grep -r "'<model-id>'" packages/ content/ examples/ --include='*.ts' --include='*.mdx' --include='*.md' --include='*.snap'

# Double-quoted (JSON in snapshots, test fixtures with embedded JSON, docs)
grep -r '"<model-id>"' packages/ content/ examples/ --include='*.ts' --include='*.mdx' --include='*.md' --include='*.snap'
```

手动验证每个结果为精确 model，而非子串匹配（例如搜索 `'grok-3'` 不得匹配 `'grok-3-mini'`）。

### 步骤 3：从类型定义中移除

从 `*-options.ts` 文件的联合类型中移除 `| 'model-id'` 行，并从 const 数组中移除条目。

### 步骤 4：更新文档

- 从 `.mdx` 文件的能力表中移除行。
- 将引用被移除 model 的内联代码示例与描述替换为继任者。
- 更新 `content/providers/03-community-providers/` 中的社区 provider 文档。

### 步骤 5：更新示例

- 在直接使用被移除 model 的示例文件中替换为继任者。
- 从示例的 model 列表中移除。
- 仅当文件除 model 本身外未演示独特功能时才删除专用示例文件（例如以 model 命名的文件）。

### 步骤 6：更新测试与 Snapshot

- 在 `*.test.ts` 文件中将 model ID 替换为继任者。
- 在 `__snapshots__/*.snap` 文件中替换 model ID——model ID 出现在序列化 JSON 字符串中。
- 在测试 fixture 的嵌入 JSON 字符串中替换（例如 `"model":"old-model"` → `"model":"new-model"`）。
- 更新 `examples/ai-functions/src/e2e/*.test.ts`——从 model 数组中移除或替换。
- 若 `packages/<provider>/README.md` 包含代码示例则更新。

### 步骤 7：运行测试

```bash
pnpm --filter @ai-sdk/<provider> test
```

对其他受影响的包也运行测试（与工作流 A 步骤 7 相同）。

</removing-obsolete-model>
