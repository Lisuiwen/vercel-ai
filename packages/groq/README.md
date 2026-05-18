# AI SDK - Groq 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Groq 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/groq)** 提供 Groq chat 与 completion API、转写支持及浏览器搜索工具的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Groq（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Groq 提供商位于 `@ai-sdk/groq` 模块，安装方式：



```bash
npm i @ai-sdk/groq
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/groq` 导入默认提供商实例 `groq`：



```ts
import { groq } from '@ai-sdk/groq';
```

## 浏览器搜索工具

Groq 提供商包含浏览器搜索工具，支持交互式网页浏览。与传统网页搜索不同，浏览器搜索以交互方式浏览网站，结果更详尽。

### 支持的模型

浏览器搜索仅适用于以下模型：

- `openai/gpt-oss-20b`
- `openai/gpt-oss-120b`

⚠️ **重要**：在其他模型上使用浏览器搜索会触发警告，且工具将被忽略。

### 基础用法

```ts
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const result = await generateText({
  model: groq('openai/gpt-oss-120b'), // Must use supported model
  prompt:
    'What are the latest developments in AI? Please search for recent news.',
  tools: {
    browser_search: groq.tools.browserSearch({}),
  },
  toolChoice: 'required', // Ensure the tool is used
});

console.log(result.text);
```

### 流式示例

```ts
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

const result = streamText({
  model: groq('openai/gpt-oss-120b'),
  prompt: 'Search for the latest tech news and summarize it.',
  tools: {
    browser_search: groq.tools.browserSearch({}),
  },
  toolChoice: 'required',
});

for await (const delta of result.fullStream) {
  if (delta.type === 'text-delta') {
    process.stdout.write(delta.text);
  }
}
```

### 主要特性

- **交互式浏览**：像用户一样浏览网站
- **结果更全面**：比传统搜索摘要更详细
- **服务端执行**：在 Groq 基础设施上运行，无需额外配置
- **由 Exa 驱动**：使用 Exa 搜索引擎获得更佳结果
- **当前免费**：测试期间无额外费用

### 最佳实践

- 使用 `toolChoice: 'required'` 确保启用浏览器搜索
- 仅支持模型：`openai/gpt-oss-20b` 与 `openai/gpt-oss-120b`
- 工具自动工作，无需配置参数
- 服务端执行意味着无需额外 API Key 或设置

### 模型校验

提供商会自动校验模型兼容性：

```ts
// ✅ Supported - will work
const result = await generateText({
  model: groq('openai/gpt-oss-120b'),
  tools: { browser_search: groq.tools.browserSearch({}) },
});

// ❌ Unsupported - will show warning and ignore tool
const result = await generateText({
  model: groq('gemma2-9b-it'),
  tools: { browser_search: groq.tools.browserSearch({}) },
});
// Warning: "Browser search is only supported on models: openai/gpt-oss-20b, openai/gpt-oss-120b"
```

## 基础文本生成

```ts
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const { text } = await generateText({
  model: groq('gemma2-9b-it'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## 文档

更多信息请参阅 **[Groq 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/groq)**。

浏览器搜索详情见 **[Groq Browser Search 文档](https://console.groq.com/docs/browser-search)**。
