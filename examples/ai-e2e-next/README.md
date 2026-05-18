# AI SDK、Next.js 与 OpenAI 聊天示例

本示例演示如何将 [AI SDK](https://ai-sdk.dev/docs) 与 [Next.js](https://nextjs.org/) 和 [OpenAI](https://openai.com) 结合，构建类似 ChatGPT 的流式聊天机器人。

## 自行部署

使用 [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=ai-sdk-example) 部署本示例：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Ftree%2Fmain%2Fexamples%2Fnext-openai&env=OPENAI_API_KEY&project-name=ai-sdk-next-openai&repository-name=ai-sdk-next-openai)

## 使用方法

使用 [npm](https://docs.npmjs.com/cli/init)、[Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) 或 [pnpm](https://pnpm.io) 执行 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 初始化示例：

```bash
npx create-next-app --example https://github.com/vercel/ai/tree/main/examples/ai-e2e-next next-openai-app
```

```bash
yarn create next-app --example https://github.com/vercel/ai/tree/main/examples/ai-e2e-next next-openai-app
```

```bash
pnpm create next-app --example https://github.com/vercel/ai/tree/main/examples/ai-e2e-next next-openai-app
```

本地运行需完成：

1. 在 [OpenAI 开发者平台](https://platform.openai.com/signup) 注册。
2. 在 [OpenAI 控制台](https://platform.openai.com/account/api-keys) 创建 API Key。
3. 若使用外部文件作为附件，请创建 [Vercel Blob Store](https://vercel.com/docs/storage/vercel-blob)。
4. 参照[示例 env 文件](./.env.local.example)，在 `.env.local` 中设置所需环境变量
5. 执行 `pnpm install` 安装依赖。
6. 执行 `pnpm dev` 启动开发服务器。

## 延伸阅读

进一步了解 OpenAI、Next.js 与 AI SDK，可参考：

- [AI SDK 文档](https://ai-sdk.dev/docs)
- [Vercel AI Playground](https://ai-sdk.dev/playground)
- [OpenAI 文档](https://platform.openai.com/docs) - 了解 OpenAI 功能与 API.
- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 功能与 API.
