# 添加新 provider

## `@ai-sdk/<provider>` 与第三方包

欢迎任何 provider 创建第三方包。我们乐意在文档中链接。

若你更希望使用官方 `@ai-sdk/<provider>` 包，请先创建 issue 讨论。

## 示例

https://github.com/vercel/ai/pull/8136/files

## 步骤

1. 创建新文件夹 `packages/<provider>`
2. 将 `packages/<provider>/package.json` 中的版本设为 `0.0.0`
3. 为新包创建 changeset，版本类型为 `major`
4. 为所有 model 类添加 workflow 序列化支持（见 [providers.md#workflow-serialization](providers.md#workflow-serialization)）
5. 根据 provider 支持的 model 类型，在 `examples/ai-functions/src/*/<provider>.ts` 添加示例
6. 在 `content/providers/01-ai-sdk-providers/<last number + 10>-<provider>.mdx` 添加文档
7. 在 npm 上 bootstrap 包并配置 Trusted Publisher（Vercel IT 团队）——见 [Bootstrapping a new `@ai-sdk/*` package](./releases.md#bootstrapping-a-new-ai-sdk-package)。首次自动化发布带 provenance 前必须完成此步骤。

另见 [providers.md](providers.md)

## 预发布模式下

若 `main` 已配置为发布 `beta` 版本，无需额外操作。注意不要将其 backport 到 `vX.Y` 稳定分支，否则在 `main` 退出预发布模式后会导致 npm 版本冲突。
