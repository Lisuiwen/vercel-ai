# MCP Elicitation UI 示例

本示例演示如何在带聊天界面的 Next.js 应用中使用 MCP（Model Context Protocol）elicitation 功能。

## 工作原理

1. **用户发送消息**请求操作（如「帮我注册新用户」）
2. **AI 模型调用相应 MCP 工具**（如 `register_user`）
3. **MCP 服务器通过带 JSON schema 的 elicitation 请求用户输入**
4. **前端根据 schema 显示模态表单**
5. **用户填写表单**并提交、拒绝或取消
6. **响应回传**至 MCP 服务器
7. **工具执行完成**，AI 模型继续对话

## 安装

### 1. 启动 MCP 服务器

```bash
pnpm tsx src/elicitation-ui/server.ts
```

服务器将在 `http://localhost:8085` 启动。

### 2. 运行 Next.js 应用

```bash
cd examples/ai-e2e-next
pnpm dev
```

### 4. 打开示例

访问 `http://localhost:3000/mcp-elicitation`

## 用法

1. 在聊天输入框输入消息，例如：
   - "register me as a new user"
   - "help me sign up for an account"
   - "I'd like to create a new account"

2. AI 将调用 `register_user` 工具，触发 elicitation 请求。

3. 将弹出模态框要求填写注册信息：
   - 用户名（必填）
   - 邮箱（必填）
   - 密码（必填）
   - 订阅通讯（可选，默认 false）

4. 你可以：
   - **提交**：接受并发送填写的表单数据
   - **拒绝**：不提供信息
   - **取消**：取消整个操作

5. 对话将根据你的响应继续。

本示例涉及 human-in-the-loop 工具与 MCP Elicitation 请求。
