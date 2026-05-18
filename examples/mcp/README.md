# MCP + AI SDK 示例

You can use the AI SDK with MCP to convert between MCP and AI SDK tool calls.
本示例演示来自 SSE 与 `stdio` MCP 服务器的工具转换。

## 构建

1. 创建 `.env` 文件（并按需添加其他配置）：

```sh
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

2. 在 AI SDK 仓库根目录执行：

```sh
pnpm install
pnpm build
```

## 运行示例

启动指定示例的服务端

```sh
pnpm server:<folder-name>
```

运行指定示例的客户端

```sh
pnpm client:<folder-name>
```

可用示例/目录：

- `sse` - SSE Transport (Legacy)
- `http` - Streamable HTTP Transport (Stateful)
- `mcp-with-auth` - MCP with authentication
- `mcp-prompts` - MCP prompts example
- `mcp-resources` - MCP resources example
- `stdio` - Stdio Transport (requires `pnpm stdio:build` first)
- `elicitation` - MCP elicitation example
- `elicitation-multi-step` - MCP multi-step elicitation example
- `elicitation-ui` - MCP elicitation with UI (server only)

用法示例：

```sh
# Start the HTTP server
pnpm server:http
```

In another terminal, run the HTTP client:

```sh
pnpm client:http
```

使用 UI 测试时，需先运行 MCP 服务器：

```sh
pnpm server:elicitation-ui
```

然后在新终端于 `examples/ai-e2e-next` 启动开发服务器，并访问 `localhost:3000/chat/mcp-elicitation`
