# 添加新模型

1. 将 model id 添加到 settings（model ids）以支持自动补全
1. 将 model id 添加到 `/content/providers/...` 下 provider 页面的列表中（底部的 Model Capabilities 表）
1. 若模型较重要，还需添加到
   - `content/providers/01-ai-sdk-providers/index.mdx`
   - `content/docs/02-foundations/02-providers-and-models.mdx`
1. 提交带 changeset 的 PR
1. 通过 Changesets PR 发布到 NPM

示例 PR：https://github.com/vercel/ai/pull/7313
