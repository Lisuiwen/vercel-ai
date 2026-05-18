# AI SDK、Next.js 与 OpenAI 聊天示例 with Sentry

本示例演示如何将 [AI SDK](https://ai-sdk.dev/docs) 与 [Next.js](https://nextjs.org/)、[OpenAI](https://openai.com) 和 [Sentry](https://sentry.io) 结合，构建带 [OpenTelemetry 支持](https://ai-sdk.dev/docs/ai-sdk-core/telemetry) 的流式聊天机器人。

## 自行部署

使用 [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=ai-sdk-example) 部署本示例：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Ftree%2Fmain%2Fexamples%2Fnext-openai-telemetry-sentry&env=OPENAI_API_KEY&envDescription=OpenAI%20API%20Key&envLink=https%3A%2F%2Fplatform.openai.com%2Faccount%2Fapi-keys&project-name=vercel-ai-openai-telemetry-sentry&repository-name=vercel-ai-openai-telemetry-sentry)

## 使用方法

使用 [npm](https://docs.npmjs.com/cli/init)、[Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) 或 [pnpm](https://pnpm.io) 执行 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 初始化示例：

```bash
npx create-next-app --example https://github.com/vercel/ai/tree/main/examples/next-openai-telemetry-sentry next-openai-telemetry-sentry-app
```

```bash
yarn create next-app --example https://github.com/vercel/ai/tree/main/examples/next-openai-telemetry-sentry next-openai-telemetry-sentry-app
```

```bash
pnpm create next-app --example https://github.com/vercel/ai/tree/main/examples/next-openai-telemetry-sentry next-openai-telemetry-sentry-app
```

本地运行需完成：

1. 在 [OpenAI 开发者平台](https://platform.openai.com/signup) 注册。
1. Go to [OpenAI's dashboard](https://platform.openai.com/account/api-keys) and create an API KEY.
1. Set the required OpenAI environment variable as the token value as shown [the example env file](./.env.local.example) but in a new file called `.env.local`
1. Sign up at [Sentry](https://sentry.io) and create a new project.
1. Copy the Sentry Organization Slug from the project settings and set it as the `SENTRY_ORG` environment variable.
1. Copy the Sentry Project Slug from the project settings and set it as the `SENTRY_PROJECT` environment variable.
1. Copy the Sentry Auth Token from the project settings and set it as the `SENTRY_AUTH_TOKEN` environment variable.
1. Copy the Sentry DSN from the project settings and set it as the `NEXT_PUBLIC_SENTRY_DSN` environment variable.
1. `pnpm install` to install the required dependencies.
1. `pnpm dev` to launch the development server.

## 延伸阅读

进一步了解 OpenAI、Next.js 与 AI SDK，可参考：

- [AI SDK 文档](https://ai-sdk.dev/docs)
- [AI SDK telemetry support](https://ai-sdk.dev/docs/ai-sdk-core/telemetry)
- [Vercel AI Playground](https://ai-sdk.dev/playground)
- [OpenAI 文档](https://platform.openai.com/docs) - 了解 OpenAI 功能与 API.
- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 功能与 API.
- [Sentry Documentation](https://docs.sentry.io) - learn about Sentry features and API.
