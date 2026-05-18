# AI SDK - DeepSeek 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[DeepSeek provider](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)** 提供对 [DeepSeek](https://www.deepseek.com) platform 的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 DeepSeek（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

DeepSeek 提供商位于 `@ai-sdk/deepseek` 模块，安装方式：



```bash
npm i @ai-sdk/deepseek
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/deepseek` 导入默认提供商实例 `deepseek`：



```ts
import { deepseek } from '@ai-sdk/deepseek';
```

## 示例

```ts
import { deepseek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';

const { text } = await generateText({
  model: deepseek('deepseek-chat'),
  prompt: 'Write a JavaScript function that sorts a list:',
});
```

## 文档

更多信息请参阅 **[DeepSeek 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)**。
