# AI SDK - WorkflowAgent 聊天示例

本示例演示如何将 AI SDK 的 `WorkflowAgent` 与 Workflow DevKit 结合，构建支持工具调用的持久化、可恢复聊天 Agent。

## 功能

- **持久 Agent**：使用 `@ai-sdk/workflow` 的 `WorkflowAgent` 实现容错执行
- **工具调用**：包含以 durable step 实现的天气查询与计算器工具
- **流式**：通过 `getWritable()` 与 `createUIMessageStreamResponse` 实时流式响应
- **可恢复**：工作流运行可在重启后存活并重新连接
- **Telemetry E2E 测试台**：访问 `/telemetry` 运行确定性 WorkflowAgent telemetry 场景（生命周期、工具执行、上下文过滤、批准、错误与重连）

## 运行

1. 安装依赖： `pnpm install`
2. 启动开发服务器：`pnpm dev`
3. 打开 http://localhost:3000

## Telemetry

打开 http://localhost:3000/telemetry 运行确定性 WorkflowAgent telemetry 场景。测试台记录稳定的 AI SDK telemetry 集成事件，涵盖生命周期回调、模型调用、chunk、工具执行、上下文过滤、批准恢复、错误处理与重连行为。
