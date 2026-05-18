# AI SDK - Perplexity 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Perplexity 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/perplexity)**
提供 Perplexity's Sonar API - a powerful answer engine with real-time web search capabilities 的语言模型支持。

## 功能

- 实时网页搜索 grounding，获得准确、最新的回答
- 支持复杂查询与追问
- Multiple tiers available:
  - **Sonar Pro**：复杂任务增强能力，引用量约 2 倍
  - **Sonar**：轻量方案，兼顾速度与成本
- 行业领先的回答质量
- 数据隐私：不使用客户数据训练
- 自助 API 访问，定价可扩展

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Perplexity（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Perplexity 提供商位于 `@ai-sdk/perplexity` 模块，安装方式：

:

```bash
npm i @ai-sdk/perplexity
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/perplexity` 导入默认提供商实例 `perplexity`：



```ts
import { perplexity } from '@ai-sdk/perplexity';
```

## 示例

```ts
import { perplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';

const { text } = await generateText({
  model: perplexity('sonar-pro'),
  prompt: 'What are the latest developments in quantum computing?',
});
```

## 文档

更多信息请参阅 **[Perplexity 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/perplexity)**。
