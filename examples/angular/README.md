# Angular AI SDK 示例

小型 Angular 应用，演示 AI SDK UI 包的聊天、补全与结构化对象生成。

## 安装

```bash
# Install dependencies
pnpm install

# Create .env file with your AI Gateway API key
echo "AI_GATEWAY_API_KEY=your_key_here" > .env

# Or use OIDC authentication
# echo "VERCEL_OIDC_TOKEN=your_token_here" > .env

# Start the app
pnpm start
```

将同时运行 Angular 前端（localhost:4200）与 Express 后端（localhost:3000）。

## 技术栈

- Angular 20
- Express.js backend
- AI SDK (@ai-sdk/angular, ai)
- AI Gateway (default provider)

## 功能

- 实时聊天界面
- 补全与结构化对象示例
- 消息流式传输
- 模拟天气工具（服务端）
- 推理流（仅支持模型）
- API 请求代理配置

在 `chat.component.ts` 中修改 `selectedModel` 以设置首选模型。
可使用 AI Gateway 模型 ID，如 `openai/gpt-5.4`。
