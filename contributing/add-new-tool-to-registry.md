# AI SDK Tools Registry - 贡献 Tool

可通过提交更新 `content/tools-registry/registry.ts` 的 pull request，将你的 tool 添加到 [registry](https://ai-sdk.dev/tools-registry)。

### 前提条件

提交前请确保：

- 已将 tool 包发布到 npm
- 已用清晰的使用说明文档化你的 tool
- 已用 AI SDK 测试你的 tool

### 添加你的 Tool

1. **Fork 并 clone 仓库**

   遵循主 [CONTRIBUTING.md](../../CONTRIBUTING.md) 中的设置说明

2. **添加 tool 条目**

   ```bash
   # Navigate to the tools registry directory
   cd content/tools-registry
   ```

   在编辑器中打开 `registry.ts`，按以下结构向 `tools` 数组添加新 tool 对象：

   ```typescript
   {
     slug: 'your-tool-slug',
     name: 'Your Tool Name',
     description: 'Clear description of what your tool does and its capabilities',
     packageName: 'your-package-name',
     tags: ['tag1', 'tag2'], // Optional: categorize your tool
     apiKeyEnvName: 'YOUR_API_KEY', // Optional: environment variable name for API key
     installCommand: {
       pnpm: 'pnpm install your-package-name',
       npm: 'npm install your-package-name',
       yarn: 'yarn add your-package-name',
       bun: 'bun add your-package-name',
     },
     codeExample: `import { generateText, gateway, isStepCount } from 'ai';
   import { yourTool } from 'your-package-name';

   const { text } = await generateText({
     model: gateway('openai/gpt-5-mini'),
     prompt: 'Your example prompt',
     tools: {
       yourTool: yourTool(),
     },
     stopWhen: isStepCount(3),
   });

   console.log(text);`,
     docsUrl: 'https://your-docs-url.com',
     apiKeyUrl: 'https://your-api-key-url.com',
     websiteUrl: 'https://your-website.com',
     npmUrl: 'https://www.npmjs.com/package/your-package-name',
   }
   ```

3. **提供可运行的代码示例**

   你的 `codeExample` 应：

   - 是完整、可运行的示例
   - 展示 tool 的真实用法
   - 使用最新的 AI SDK 模式
   - 包含必要的 import
   - 经测试确保可用

4. **提交 pull request**

   ```bash
   # Create a new branch
   git checkout -b feat/add-tool-your-tool-name

   # Add and commit your changes
   git add content/tools-registry/registry.ts
   git commit -m "feat(tools-registry): add your-tool-name"

   # Push and create a pull request
   git push origin feat/add-tool-your-tool-name
   ```

   PR 标题格式：`feat(tools-registry): add your-tool-name`

## 有问题？

若对将 tool 添加到 registry 有疑问：

- 查看主 [CONTRIBUTING.md](../../CONTRIBUTING.md) 指南
- 参考 `registry.ts` 中现有 tool 条目作为示例
- 在 [GitHub](https://github.com/vercel/ai/issues) 上开 issue
