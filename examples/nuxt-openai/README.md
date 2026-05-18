# AI SDK、Nuxt 与 OpenAI 聊天示例

本示例演示如何将 [AI SDK](https://ai-sdk.dev/docs) 与 [Nuxt](https://nuxt.com/) 和 [OpenAI](https://openai.com) 结合，构建类似 ChatGPT 的流式聊天机器人。

## 自行部署

使用 [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=ai-sdk-example) 部署本示例：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Ftree%2Fmain%2Fexamples%2Fnuxt-openai&env=NUXT_OPENAI_API_KEY&envDescription=OpenAI%20API%20Key&envLink=https%3A%2F%2Fplatform.openai.com%2Faccount%2Fapi-keys&project-name=ai-chat&repository-name=nuxt-ai-chat)

## 使用方法

Execute `create-nuxt` to bootstrap the example:

```bash
npx create-nuxt -t github:vercel/ai/examples/nuxt-openai nuxt-openai
```

本地运行需完成：

1. 在 [OpenAI 开发者平台](https://platform.openai.com/signup) 注册。
2. 在 [OpenAI 控制台](https://platform.openai.com/account/api-keys) 创建 API Key。
3. Set the required OpenAI environment variable as the token value as shown [the example env file](./.env.example) but in a new file called `.env`.
4. 执行 `pnpm install` 安装依赖。
5. 执行 `pnpm dev` 启动开发服务器。

## 部署到 Vercel

本示例可直接部署到 Vercel，可执行：

```bash
pnpm run build
vercel deploy
```

本示例配置为使用 `vercel-edge` [Nitro preset](https://nitro.unjs.io/deploy/providers/vercel#vercel-edge-functions)。
这意味着示例将部署到 Vercel Edge Network。
可通过修改 `nuxt.config.ts` 或使用 `NITRO_PRESET` 环境变量切换提供商（如 `vercel`）。

## 延伸阅读

To learn more about OpenAI, Nuxt, and the AI SDK take a look at the following resources:

- [AI SDK 文档](https://ai-sdk.dev/docs) - learn mode about the AI SDK
- [Vercel AI Playground](https://ai-sdk.dev/playground) - 并排对比与调优 20+ 模型
- [OpenAI 文档](https://platform.openai.com/docs) - 了解 OpenAI 功能与 API.
- [Nuxt Documentation](https://nuxt.com/docs) - learn about Nuxt features and API.
