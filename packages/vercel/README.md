# AI SDK - Vercel 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Vercel 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/vercel)**
可访问面向现代 Web 应用设计的 v0 API。`v0-1.0-md` 模型支持文本与图像输入、快速流式响应，并兼容 OpenAI Chat Completions API 格式。

Key features include:

- 框架感知补全：针对 Next.js、Vercel 等现代技术栈优化
- 自动修复：在生成过程中识别并修正常见编码问题
- 快速编辑：在可用时流式输出行内编辑
- 多模态：支持文本与图像输入

## 安装

Vercel 提供商位于 `@ai-sdk/vercel` 模块，安装方式：



```bash
npm i @ai-sdk/vercel
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/vercel` 导入默认提供商实例 `vercel`：



```ts
import { vercel } from '@ai-sdk/vercel';
```

## 示例

```ts
import { vercel } from '@ai-sdk/vercel';
import { generateText } from 'ai';

const { text } = await generateText({
  model: vercel('v0-1.0-md'),
  prompt: 'Create a Next.js app',
});
```

## 文档

更多信息请参阅 **[Vercel 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/vercel)**。
