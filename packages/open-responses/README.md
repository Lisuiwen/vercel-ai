# AI SDK - Open Responses 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Open Responses 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/open-responses)**
提供 [Open Responses](https://www 的语言模型支持。openresponses.org/) compatible APIs.

## 安装

Open Responses 提供商位于 `@ai-sdk/open-responses` 模块，安装方式：



```bash
npm i @ai-sdk/open-responses
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

使用 `createOpenResponses` 创建 Open Responses 提供商实例：

```ts
import { createOpenResponses } from '@ai-sdk/open-responses';

const openResponses = createOpenResponses({
  name: 'aProvider',
  url: 'http://localhost:1234/v1/responses',
});
```

可通过该实例访问任意 Open Responses 兼容端点提供的模型。

## 示例

```ts
import { createOpenResponses } from '@ai-sdk/open-responses';
import { generateText } from 'ai';

const openResponses = createOpenResponses({
  name: 'aProvider',
  url: 'http://localhost:1234/v1/responses',
});

const { text } = await generateText({
  model: openResponses('mistralai/ministral-3-14b-reasoning'),
  prompt: 'Invent a new holiday and describe its traditions.',
  maxOutputTokens: 100,
});
```

## 文档

更多信息请参阅 **[Open Responses 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/open-responses)**。
