---
name: major-version-mode
description: "在下一个 AI SDK 主版本上工作的上下文。仅当用户显式调用时使用（例如通过 '/major-version-mode'）。请勿根据任务内容自动触发。"
metadata:
  internal: true
---

## 上下文

本任务属于下一个 AI SDK 主版本。可接受破坏性变更。

## 破坏性变更指南

虽然可接受破坏性变更，仍建议尽量减少对 AI SDK 第三方消费者的不必要干扰。提供已弃用别名与自动化迁移逻辑有助于平滑过渡。

### 重命名/变更的导出

若重命名或修改导出的函数或类型，在可行时于包级提供已弃用别名：

```typescript
/** @deprecated Use `newFunctionName` instead. */
export { newFunctionName as oldFunctionName } from './new-module';
```

仅当不会引入有意义的技术债时才这样做。若会引入，可跳过别名——但在做干净断裂之前**先与用户确认**。

### 修改的消息类型（例如在 `@ai-sdk/provider-utils` 中）

若修改 model 消息形状（例如 `packages/provider-utils/src/types/content-part.ts` 中的 content part 类型）：

1. **在 `@ai-sdk/provider-utils` 中弃用而非立即移除**（若可行）。用 `@deprecated` JSDoc 与 `TODO` 注明在下一主版本中移除。
2. **在 `packages/ai/src/prompt/content-part.ts` 中保留已弃用的等价物**——该文件是面向消费者的层，应在 Zod schema 中保留旧形状，使现有消费者代码仍能编译并收到弃用警告。同样注明弃用与下一主版本移除。
3. 若干净弃用不可行且会引入有意义的技术债，可能更适合硬移除——但**先与用户确认**。

### Provider 规范变更（`@ai-sdk/provider`）

`provider` 包定义 provider 实现者所遵循的规范。一般不应在主版本外修改，因此保持规范清晰一致至关重要。

与其他地方相比，此处**不**维持临时向后兼容措施的破坏性变更更可接受，因为受众更小——自行实现 provider 的开发者远少于在 AI SDK 之上构建功能的开发者。

规则：

- **仅修改最新 spec 版本。** 旧版本化的 spec 接口必须完全不动。
- 不需要已弃用别名——优先干净断裂以保持规范清晰。
- 当前 spec 版本**不等于**当前 AI SDK 主版本号。若不清楚应操作哪个 spec 版本，**在继续之前询问用户**。

## 文档

实现变更后，更新 `content/docs/` 中的相关文档。

若变更要求消费者更新代码或迁移存储数据，在最新迁移指南中添加一节：

- 在 `content/docs/08-migration-guides/` 中找到版本号最高的迁移指南
- 添加简明一节，说明变更内容及如何迁移
