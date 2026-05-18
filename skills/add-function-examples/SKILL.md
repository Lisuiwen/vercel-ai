---
name: add-function-examples
description: 为针对真实 provider API 测试特定功能而添加新的 AI function 示例的指南。
metadata:
  internal: true
---

## 添加 Function 示例

审阅当前分支的变更，找出适合在 `examples/ai-functions` 目录中添加示例的新功能、修改或 bug 修复。这些示例用于针对真实 provider API 测试特定功能，也可作为用户文档。

确定示例应针对的 model 类型与顶层 function。对于 language model，应添加两个变体：一个用于 `generateText`，一个用于 `streamText`。对于其他 model 类型，为相应的顶层 function 添加示例（例如 `generateImage`、`generateSpeech`）。

创建示例后，运行 `pnpm type-check:full`；修复遇到的任何错误。
