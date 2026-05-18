# AI SDK - Fireworks 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Fireworks provider](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)** contains language model and image model support for the [Fireworks](https://fireworks.ai) platform.

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Fireworks（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Fireworks 提供商位于 `@ai-sdk/fireworks` 模块，安装方式：



```bash
npm i @ai-sdk/fireworks
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/fireworks` 导入默认提供商实例 `fireworks`：



```ts
import { fireworks } from '@ai-sdk/fireworks';
```

## Language Model Example

```ts
import { fireworks } from '@ai-sdk/fireworks';
import { generateText } from 'ai';

const { text } = await generateText({
  model: fireworks('accounts/fireworks/models/deepseek-v3'),
  prompt: 'Write a JavaScript function that sorts a list:',
});
```

## Image Model Examples

```ts
import { fireworks } from '@ai-sdk/fireworks';
import { generateImage } from 'ai';
import fs from 'fs';

const { image } = await generateImage({
  model: fireworks.image('accounts/fireworks/models/flux-1-dev-fp8'),
  prompt: 'A serene mountain landscape at sunset',
});
const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

## 文档

更多信息请参阅 **[Fireworks 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)**。
