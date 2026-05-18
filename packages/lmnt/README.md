# AI SDK - LMNT 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[LMNT provider](https://ai-sdk.dev/providers/ai-sdk-providers/lmnt)**
提供 LMNT API 的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 LMNT（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

LMNT 提供商位于 `@ai-sdk/lmnt` 模块，安装方式：



```bash
npm i @ai-sdk/lmnt
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/lmnt` 导入默认提供商实例 `lmnt`：



```ts
import { lmnt } from '@ai-sdk/lmnt';
```

## 示例

```ts
import { lmnt } from '@ai-sdk/lmnt';
import { experimental_generateSpeech as generateSpeech } from 'ai';

const result = await generateSpeech({
  model: lmnt.speech('aurora'),
  text: 'Hello, world!',
});
```

## 文档

更多信息请参阅 **[LMNT 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/lmnt)**。
