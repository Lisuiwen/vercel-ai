# AI SDK - Azure OpenAI 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Azure provider](https://ai-sdk.dev/providers/ai-sdk-providers/azure)** 提供对 Azure OpenAI API 的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Azure OpenAI（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Azure 提供商位于 `@ai-sdk/azure` 模块，安装方式：



```bash
npm i @ai-sdk/azure
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/azure` 导入默认提供商实例 `azure`：



```ts
import { azure } from '@ai-sdk/azure';
```

## 示例

```ts
import { azure } from '@ai-sdk/azure';
import { generateText } from 'ai';

const { text } = await generateText({
  model: azure('gpt-4o'), // your deployment name
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## 文档

更多信息请参阅 **[Azure 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/azure)**。
