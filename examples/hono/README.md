# Hono + AI SDK 示例

可在 [Hono](https://hono.dev/) 服务器中使用 AI SDK 生成并流式传输文本与对象。

## 用法

1. 创建 `.env` 文件（并按需添加其他配置）：

```sh
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

2. 在 AI SDK 仓库根目录执行：

```sh
pnpm install
pnpm build
```

3. Run the following command:

```sh
pnpm dev
```

4. Test the endpoint with Curl:

```sh
curl -i -X POST http://localhost:8080/text
```
