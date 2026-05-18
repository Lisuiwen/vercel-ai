# AI SDK、Next.js 与 Google Vertex AI Edge 示例

本示例演示如何将 [AI SDK](https://ai-sdk.dev/docs) 与 [Next.js](https://nextjs.org/) 和 [Google Vertex AI](https://cloud.google.com/vertex-ai) 结合，验证 AI SDK 的 Google Vertex 提供商可在 Edge 运行时成功运行。

## 自行部署

使用 [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=ai-sdk-example) 部署本示例：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai%2Ftree%2Fmain%2Fexamples%2Fnext-google-vertex-edge&env=GOOGLE_VERTEX_API_KEY&project-name=ai-sdk-vertex-edge&repository-name=ai-sdk-vertex-edge)

## 使用方法

使用 [npm](https://docs.npmjs.com/cli/init)、[Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) 或 [pnpm](https://pnpm.io) 执行 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 初始化示例：

```bash
npx create-next-app --example https://github.com/vercel/ai/tree/main/examples/next-google-vertex-edge next-vertex-edge-app
```

本地运行需完成：

1. Set up a [Google Cloud Project](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
2. Enable the [Vertex AI API](https://cloud.google.com/vertex-ai/docs/start/cloud-console)
3. Choose one of the following authentication methods:

   **Option A: API Key (Express Mode - Recommended for getting started)**
   - Get an API key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Set `GOOGLE_VERTEX_API_KEY` in your environment

   **Option B: Service Account (OAuth)**
   - Create a [service account and download credentials](https://cloud.google.com/docs/authentication/getting-started)
   - Set `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and optionally `GOOGLE_PRIVATE_KEY_ID`
   - Set `GOOGLE_VERTEX_PROJECT` and `GOOGLE_VERTEX_LOCATION`

4. `pnpm install` to install the required dependencies
5. `pnpm dev` to launch the development server

## 延伸阅读

To learn more about Google Vertex AI, Next.js, and the AI SDK take a look at the following resources:

- [AI SDK 文档](https://ai-sdk.dev/docs)
- [Vercel AI Playground](https://ai-sdk.dev/playground)
- [Google Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs) - learn about Vertex AI features and API
- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 功能与 API
