# AI SDK、Next.js 与 FastAPI 示例

这些示例演示如何将 [AI SDK](https://ai-sdk.dev/docs) 与 [Next.js](https://nextjs.org) 和 [FastAPI](https://fastapi.tiangolo.com) 结合使用。

## 使用方法

使用 [npm](https://docs.npmjs.com/cli/init)、[Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) 或 [pnpm](https://pnpm.io) 执行 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 初始化示例：

```bash
npx create-next-app --example https://github.com/vercel/ai/tree/main/examples/next-fastapi next-fastapi-app
```

```bash
yarn create next-app --example https://github.com/vercel/ai/tree/main/examples/next-fastapi next-fastapi-app
```

```bash
pnpm create next-app --example https://github.com/vercel/ai/tree/main/examples/next-fastapi next-fastapi-app
```

运行 FastAPI 服务器还需安装 [Python 3.6+](https://www.python.org/downloads) 与 [virtualenv](https://virtualenv.pypa.io/en/latest/installation.html)。

本地运行需完成：

1. 在 [OpenAI 开发者平台](https://platform.openai.com/signup) 注册。
2. 在 [OpenAI 控制台](https://platform.openai.com/account/api-keys) 创建 API Key。
3. 参照[示例 env 文件](./.env.local.example)，在 `.env.local` 中设置所需环境变量。
4. 执行 `virtualenv venv` 创建 Python 虚拟环境。
5. 执行 `source venv/bin/activate` 激活虚拟环境。
6. 执行 `pip install -r requirements.txt` 安装 Python 依赖。
7. `pnpm install` to install the required dependencies.
8. `pnpm dev` to launch the development server.

## 延伸阅读

进一步了解 AI SDK、Next.js 与 FastAPI，可参考：

- [AI SDK 文档](https://ai-sdk.dev/docs) - 查看 AI SDK 文档与参考。
- [Vercel AI Playground](https://ai-sdk.dev/playground) - 试用不同模型并选择最适合的方案。
- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 功能与 API。
- [FastAPI 文档](https://fastapi.tiangolo.com) - 了解 FastAPI 功能与 API。
