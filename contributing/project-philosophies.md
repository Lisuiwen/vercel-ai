# 项目理念

## 核心架构

- **统一的 provider 接口（适配器模式）。** 保持分层架构（Specifications → Utilities → Providers → Core），在多种 AI provider 上提供单一、一致的 API。
  - 这是我们 central 架构骨干，也是 AI SDK 的核心所在。
  - 也使社区 provider 能在第三方包中独立开发。

- **保持构建块分离。** provider 抽象层之外的构建块必须架构清晰，且不与该层纠缠。
  - 对 tree shaking 与 agentic 开发至关重要。
  - 强化架构边界可降低复杂度与副作用风险。

- **精简、聚焦的使命。** 保持 AI SDK 聚焦核心使命：provider 抽象层，以及其上的直接相关构建块（例如 UI chatbot 协议）。
  - 对全新构建块的添加应保守。任何此类功能都需与团队仔细评估。
  - 更好的方案往往是基于 AI SDK 构建独立项目。

## API 设计

- **稳定性与向后兼容优先。** 变更必须保持向后兼容——切勿更改现有公开函数的签名。唯一例外是新的 AI SDK 主版本发布。
  - 即使在主版本中，破坏性变更也应有充分理由。
  - 若保持公开 API 不变会导致较差或痛苦的 DX，进行破坏性变更是完全正确的——但必须作为新的主版本发布的一部分。

- **对 `@ai-sdk/provider` 极度谨慎。** 该包包含规范。将任何规范变更视为潜在破坏性。
  - 理想情况下，`@ai-sdk/provider` 的变更仅与新的 AI SDK 主版本发布对齐。

- **保守的 API 表面。** 尽量严格限制 provider option schema，以保留未来变更的灵活性。
  - 保持 response schema 精简（无未使用属性）。
  - 保持 schema 足够灵活，以应对 provider API 变更而不造成不必要的破坏性。
  - 使用最少的包导出，尤其是负责规范的 `@ai-sdk/provider` 包。消费代码中鼓励使用 TypeScript 原语 `Params` 与 `ReturnType`，而非直接导出底层类型。

- **警惕过早抽象。** Provider API 演进迅速。避免添加在各 provider 间翻译方式不同的泛型参数或抽象。
  - 遵循 rule of 3：至少 3 个 provider 实现同一概念后再泛化，以确保抽象稳固。
  - 不确定或 provider 专用时，优先使用 `providerOptions`。
  - 基于单一 provider 抽象的压力可能很大。应抵制。

- **使用 `Experimental_` 前缀在主版本周期外探索新功能。** 当新功能需要在主版本周期外探索时，使用明确标记为实验性的代码结构（例如类型的 `Experimental_*` 前缀、函数的 `experimental_*` 前缀）。这样可在不承诺稳定 API 契约的情况下迭代。
  - `@ai-sdk/provider` 为此目的导出 `Experimental_*` 类型是可接受的。这些类型可能在主版本外发生破坏性变更。
  - 非实验类型不得引用实验类型（例如不要将 `Experimental_VideoModelV4` 之类引用加入 `ProviderV4`）。
  - 实验功能在晋升为稳定之前必须完全隔离。
  - 添加新实验功能需要维护者广泛共识。谨慎使用。不要用实验代码作为不确定稳定性时的退路。

- **清晰、准确的命名。** 有疑问时，优先使用更长、更明确且无歧义的名称（例如 `.languageModel(id)` 优于 `.chat(id)`）。
  - 为开发者与 coding agent 优化清晰度，而非简短。

## 开发者与 Agent 体验

- **为开发者与 agent 共同构建。** 一致的 API、开发模式与命名约定是关键。
  - 关注使用 agent 编写 AI SDK 代码时常见的 agent 幻觉。
  - agent 幻觉有时值得作为 API 应按 agent 最初预期方式工作的建议来考虑。

- **通过一致性提升 DX。** 一致的命名约定与开发模式改善开发者体验。
  - 规范化约定对 coding agent 极其重要——在 `AGENTS.md` 中文档化。
  - 这在技术上解耦的 provider 实现之间尤其重要。
