# 发布

# 发布 - 仅供维护者

我们使用 [changesets](https://github.com/changesets/action) 进行自动化发布。

## Changesets

- 每个修改生产代码（非 `examples`/`docs`）的 pull request 必须包含 changeset。
- 默认使用 `patch`（非破坏性）。
- 要覆盖时，应用 `minor` 或 `major` 标签（否则 CI 会强制 `patch`）。

## 常规发布

- [Changesets action](https://github.com/changesets/action) 会自动创建 **Version Packages** PR。
- 合并该 PR 会触发发布工作流，将 npm 包发布出去。

## 维护版本发布

- 在维护分支上启用 [`release` workflow](https://github.com/vercel/ai/blob/main/.github/workflows/release.yml)。
- 仅允许 `patch` 发布。
- 发布步骤：
  1. 针对维护分支创建 pull request。
  2. 合并以触发发布工作流。

## Beta / 预发布周期

关于在 `main` 上开发下一主版本 beta 的同时为维护稳定版打 patch，见 **[Pre-Release Cycle](./pre-release-cycle.md)**。

快速参考：

- 进入 beta 模式：`pnpm changeset pre enter beta`
- 退出 beta 模式：`pnpm changeset pre exit`
- Backport 修复：为已合并的 PR 添加 `backport` 标签

## Provenance

所有包均使用 [npm provenance](https://docs.npmjs.com/generating-provenance-statements) 发布。通过以下启用：

- 每个包 `package.json` 中的 `publishConfig.provenance: true`
- `.github/workflows/release.yml` 中的 `id-token: write` 权限
- 在 npmjs.com 上为每个包配置的 [Trusted Publisher](https://docs.npmjs.com/trusted-publishers)，指向 `vercel/ai` 与 `release.yml`

对于已有包，无需操作——每次发布都会自动附带 provenance。对于**新**包，见下方 [Bootstrapping a new `@ai-sdk/*` package](#bootstrapping-a-new-ai-sdk-package)。

### Bootstrapping a new `@ai-sdk/*` package

npm 要求包存在后才能为其配置 Trusted Publisher。因此首次发布必须在 monorepo 发布工作流接入之前手动完成，且须由对 `@ai-sdk` npm scope 有发布权限的 Vercel IT 团队成员执行。

步骤：

1. 在 monorepo 外创建新的空文件夹。
2. `cd` 进入该文件夹。
3. 根据下方模板创建 `package.json`，将 `<package-name>` 替换为实际名称：

   ```json
   {
     "name": "@ai-sdk/<package-name>",
     "version": "0.0.0",
     "publishConfig": {
       "access": "public",
       "provenance": true
     },
     "repository": {
       "type": "git",
       "url": "https://github.com/vercel/ai",
       "directory": "packages/<package-name>"
     }
   }
   ```

4. 运行 `npm publish`。
5. 打开 `https://www.npmjs.com/package/@ai-sdk/<package-name>/access` 并配置 Trusted Publisher：
   - **Publisher:** GitHub Actions
   - **Organization or user:** `vercel`
   - **Repository:** `ai`
   - **Workflow name:** `release.yml`
   - **Environment name:** _(leave empty)_

完成后，该包后续发布走 `main` 上的常规 changesets 流程。
