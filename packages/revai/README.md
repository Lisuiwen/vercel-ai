# AI SDK - Rev.ai 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Rev.ai 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/revai)**
提供 Rev 的语言模型支持。ai transcription API.

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Rev.ai（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Rev.ai 提供商位于 `@ai-sdk/revai` 模块，安装方式：



```bash
npm i @ai-sdk/revai
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/revai` 导入默认提供商实例 `revai`：



```ts
import { revai } from '@ai-sdk/revai';
```

## 示例

```ts
import { revai } from '@ai-sdk/revai';
import { experimental_transcribe as transcribe } from 'ai';

const { text } = await transcribe({
  model: revai.transcription('machine'),
  audio: new URL(
    'https://github.com/vercel/ai/raw/refs/heads/main/examples/ai-functions/data/galileo.mp3',
  ),
});
```

## 文档

更多信息请参阅 **[Rev.ai 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/revai)**。
