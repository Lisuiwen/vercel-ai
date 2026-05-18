# 预发布周期

本指南说明如何为 AI SDK 的新主版本启动与结束预发布（beta）周期。

## 概览

AI SDK 的每个主版本都会引入新的 provider 规范版本（例如 V3 到 V4）。演进规范是我们做 major release 的原因——它允许对 provider 接口做破坏性变更，同时为 provider 作者提供清晰的迁移目标。

预发布周期允许在 `main` 上开发下一主版本，同时保持当前稳定版可接收 patch。周期内：

- `main` 发布 beta 版本（例如 `ai@7.0.0-beta.1`）
- 维护分支（例如 `release-v6.0`）接收 backport 的 patch 并发布稳定版

## 启动预发布周期

### 1. 创建维护分支

从当前 `main` HEAD 创建分支，使当前稳定版可继续接收 patch：

```bash
git checkout main
git pull origin main
git checkout -b release-v<current-major>.0   # e.g. release-v6.0
git push origin release-v<current-major>.0
```

[release workflow](../.github/workflows/release.yml) 已在 `release-v*` 分支上运行，无需修改工作流。

### 2. 在维护分支上设置 npm dist-tag

在新维护分支上，更新根 `package.json` 中的 `ci:release` 脚本，使用版本特定的 npm dist-tag 发布。这可防止维护版本发布占用 npm 上的 `latest` 标签：

```diff
-    "ci:release": "turbo clean && turbo build && changeset publish",
+    "ci:release": "turbo clean && turbo build && changeset publish --tag ai-v<current-major>",
```

例如，对 `release-v6.0` 使用 `--tag ai-v6`。直接提交并推送到维护分支。

### 3. 在 `main` 上进入预发布模式

切回 `main` 并进入 changeset 预发布模式：

```bash
git checkout main
pnpm changeset pre enter beta
```

这会修改 `.changeset/pre.json`。`initialVersions` 字段应仅包含 `packages/*/package.json` 中的包——移除其他条目（例如 `@example/*`、`tools/*` 或嵌套测试包）。提交并推送（或开 PR）。

### 4. 创建 major changeset

创建将所有已发布包 bump 到下一主版本的 changeset：

```bash
pnpm changeset
```

选择 `packages/*/package.json` 中的所有包（跳过 `@example/*`、`tools/*` 及其他非 `packages/` 条目——它们为私有且不发布），每个选择 `major`。摘要可写：

> Start v7 pre-release

提交生成的 `.changeset/*.md` 文件。

### 5. 播种新 spec 版本

每个主版本都会引入新的 provider 规范版本（例如 V3 到 V4）。必须为 `packages/provider/src/` 下每个包含版本化子目录的 spec 目录创建新版本目录。查找方式：

```bash
ls -d packages/provider/src/*/v3
```

截至撰写时，目录包括：`embedding-model`、`embedding-model-middleware`、`image-model`、`image-model-middleware`、`language-model`、`language-model-middleware`、`provider`、`reranking-model`、`shared`、`speech-model`、`transcription-model`、`video-model`。

对**每个**目录：

1. 将当前 spec 目录（例如 `v3/`）复制到新版本目录（例如 `v4/`）。
2. 将所有文件从旧版本重命名为新版本（例如 `language-model-v3.ts` → `language-model-v4.ts`）。
3. 在每个文件内，将所有旧版本替换为新版本（类型名、导入与 `specificationVersion` 字面量中的 `V3` → `V4`、`v3` → `v4`）。
4. 在父级 `index.ts` 中添加 `export * from './v4/index';`（在 v3 export 之前）。
5. 更新交叉引用：若 `provider` v4 spec 导入其他 model 类型，确保从新的 v4 路径导入（而非 v3）。

通过在 `packages/provider` 中运行 `pnpm build` 验证——所有新类型应出现在构建的 `.d.ts` 输出中。

### 6. 创建 mock 测试工具

为 `packages/ai/src/test/` 中每个 mock 文件创建 V4 对应物（例如 `mock-language-model-v3.ts` → `mock-language-model-v4.ts`）。更新 `packages/ai/test/index.ts` 以导出新的 V4 mock。

### 7. 更新 `packages/ai` 以支持新 spec 版本

核心 `packages/ai` 包需要 adapter 函数、更新的公开 API 与测试更新，以在保留旧版本的同时支持新 spec 版本。

#### Adapter 函数

在 `packages/ai/src/model/` 中为每种 model 类型创建 V4 adapter 文件。这些使用 `Proxy` 通过覆盖 `specificationVersion` 将 V3 model 转为 V4：

- `as-language-model-v4.ts`
- `as-embedding-model-v4.ts`
- `as-image-model-v4.ts`
- `as-speech-model-v4.ts`
- `as-transcription-model-v4.ts`
- `as-reranking-model-v4.ts`
- `as-video-model-v4.ts`
- `as-provider-v4.ts`（通过包装所有 model 工厂方法将 V3 provider 转为 V4）

每个 adapter 检查 `specificationVersion`：若已是 V4 则原样返回，否则用 Proxy 包装。

每个 adapter 应有对应测试文件（例如 `as-language-model-v4.test.ts`），验证：

- V4 输入原样返回（用 `.toBe()` 做 identity check）
- V3 输入被代理且 `specificationVersion` 改为 `'v4'`
- V2 输入（如适用）先经 V3 再转为 V4
- 属性与方法通过 proxy 保留

#### 公开 API 更新

更新以下文件，在公开边界接受 `V2 | V3 | V4` model，内部用 adapter 转为 V4：

- `packages/ai/src/middleware/wrap-language-model.ts` — 接受 `LanguageModelV2 | V3 | V4`
- `packages/ai/src/middleware/wrap-image-model.ts` — 接受 `ImageModelV2 | V3 | V4`
- `packages/ai/src/middleware/wrap-embedding-model.ts` — 接受 `EmbeddingModelV3 | V4`（V2 为泛型，不包含；为向后兼容保留 V3）
- `packages/ai/src/registry/custom-provider.ts` — 在所有 model map 中接受 V2/V3/V4 model
- `packages/ai/src/registry/provider-registry.ts` — 接受 `ProviderV2 | V3 | V4`，用 `asProviderV4` 转换
- `packages/ai/src/types/language-model-middleware.ts` — 放宽以同时接受 V3 与 V4 middleware

#### 测试更新

- 为每个 V4 adapter 创建测试文件（例如 `as-language-model-v4.test.ts`），验证 identity 直通、V3→V4 与 V2→V4 转换。
- 更新 `resolve-model.test.ts`：分别测试 V3→V4 转换（用 V3 mock）与 V4 直通（用 V4 mock）。
- 更新其他测试文件，在代码现返回 V4 model 处使用 V4 mock（例如 `custom-provider.test.ts`、`provider-registry.test.ts`、middleware 测试）。任何检查引用相等性（`.toBe()`）的测试应使用 V4 mock。

在 `packages/ai` 运行 `pnpm test`，在 workspace 根目录运行 `pnpm type-check:full` 以验证。

### 8. 设置文档站点（ai-sdk.dev）

文档站点位于 `ai-studio` 仓库，通过 Git submodule 指向本仓库。预发布周期内站点需要为稳定版与 beta 文档配置版本化分支与 Vercel 部署。

在 `vercel/ai` 仓库：

1. 更新 `.github/workflows/update-sdk-submodule-v6.yml`，跟踪 `release-v6.0` 分支而非 `main`。
2. 创建 `.github/workflows/update-sdk-submodule-v7.yml`——该工作流拉取 `main`，在 `ai-studio` 中 checkout `sdk/v7` 分支，并推送到 `origin sdk/v7`。

在 `ai-studio` 仓库：

3. 创建 `sdk/v7` 分支（默认分支暂保持 `sdk/v6`，使生产站点继续提供稳定文档）。
4. 在 Vercel 中创建连接到 `sdk/v7` 分支的 v7 预览部署（例如 `v7.ai-sdk.dev`）。

### 9. 合并到 `main`

将步骤 3–7 的所有变更开 PR。合并后，首个 beta 版本（例如 `ai@7.0.0-beta.1`）将自动发布。

## 预发布周期期间

### 日常开发

- 所有功能 PR 继续 targeting `main`。
- 每个 PR 仍需要 changeset（默认使用 `patch`）。
- 合并 **Version Packages** PR 时会自动发布 beta 版本。

### Backport 修复到稳定版

要将 `main` 上的修复 backport 到维护分支，为已合并的 PR 添加 `backport` 标签。这会自动创建 targeting 维护分支的新 PR。

### 发布稳定 patch

合并到维护分支的 patch 会触发发布工作流并发布稳定 patch 版本。

## 结束预发布周期

当新主版本准备好稳定发布时：

### 1. 退出预发布模式

```bash
git checkout main
pnpm changeset pre exit
```

这会删除 `.changeset/pre.json`。提交并推送（或开 PR）。

### 2. 发布稳定版本

退出 PR 合并后，下一次 **Version Packages** PR 将产生稳定版本（例如 `ai@7.0.0`）。合并以发布。

### 3. 切换文档站点

在 `ai-studio` 仓库中，将默认分支从 `sdk/v6` 改为 `sdk/v7`，使生产站点提供新主版本。相应更新 Vercel 生产部署。

### 4. 归档维护分支

维护分支（例如 `release-v6.0`）可保留用于紧急 patch，但将不再定期接收 backport。
