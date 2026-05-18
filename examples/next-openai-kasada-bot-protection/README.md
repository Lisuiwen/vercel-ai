# Next.js x AI SDK x Kasada

基于 Vercel AI SDK 与 [Kasada](https://www.kasada.io/) 高级机器人防护的 AI 聊天应用集成示例。

本实现在调用 LLM 的 API 链路中介入，在滥用发生前进行拦截。

# 安装

1. 执行以下命令安装依赖并创建 `.env.local`：

```sh
pnpm i
cp .env.local.example .env.local # and fill in the required values
```

2. 根据 Kasada 控制台，在 `kasada-server.ts` 与 `kasada-client.ts` 中更新 API URL，格式类似：

```
https://${kasadaAPIHostname}/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/api/${kasadaAPIVersion}/classification
```

3. Move the existing `app/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/[[...restpath]]/route.ts` file to your
   new path, and fill in the `KASADA_ENDPOINT` and `X-Forwarded-Host` header inside of it. They're labelled `FILL_IN`.
