# 命名约定

## 流事件与 Part 类型名称

连字符类型名（用于 stream 事件、message part 与 UI message chunk）遵循 **名词-动词**（主体-动作）模式：

```
<noun>-<action>
```

示例：

- `text-start`、`text-delta`、`text-end`
- `reasoning-start`、`reasoning-delta`、`reasoning-end`
- `tool-input-start`、`tool-input-delta`、`tool-input-end`
- `stream-start`
- `tool-call`、`tool-result`、`tool-error`
- `source-url`、`source-document`
- `response-metadata`、`message-metadata`

名词描述事件**关于什么**，动词/动作描述**发生了什么**。

**不要**使用动词在前的名称，如 `start-step` 或 `finish-step`。应使用 `step-start` 与 `step-end`。

### 推荐动词

对于流式生命周期事件，请一致使用以下动词：

| Verb    | Meaning                            | Example                          |
| ------- | ---------------------------------- | -------------------------------- |
| `start` | 流或区段开始                       | `text-start`、`reasoning-start`  |
| `delta` | 流内增量更新                       | `text-delta`、`tool-input-delta` |
| `end`   | 流或区段结束                       | `text-end`、`reasoning-end`      |

生命周期中的最终事件使用 `end`（而非 `finish`、`stop` 或 `complete`）。

对于非生命周期事件，使用最贴切的动词：

| Verb        | Meaning                              | Example                                         |
| ----------- | ------------------------------------ | ----------------------------------------------- |
| `available` | 数据可供消费                         | `tool-input-available`、`tool-output-available` |
| `error`     | 发生错误                             | `tool-input-error`、`tool-output-error`         |
| `request`   | 请求操作（例如审批）                 | `tool-approval-request`                         |
| `response`  | 对请求的响应                         | `tool-approval-response`                        |
| `denied`    | 请求被拒绝                           | `tool-output-denied`                            |

> **Note:** 现有代码中存在违反上述约定的用法（UI message stream chunk 中的 `start-step` 与 `finish-step`）。在可能时应迁移为 `step-start` 与 `step-end`。
