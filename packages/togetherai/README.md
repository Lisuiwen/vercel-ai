# AI SDK - Together.ai 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Together.ai 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)** 提供对 [Together.ai](https://together.ai) platform 的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Together.ai（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Together.ai 提供商位于 `@ai-sdk/togetherai` 模块，安装方式：



```bash
npm i @ai-sdk/togetherai
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/togetherai` 导入默认提供商实例 `togetherai`：



```ts
import { togetherai } from '@ai-sdk/togetherai';
```

## 示例

```ts
import { togetherai } from '@ai-sdk/togetherai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: togetherai('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'),
  prompt: 'Write a Python function that sorts a list:',
});
```

## 文档

更多信息请参阅 **[Together.ai 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)**。
