# AI SDK - Replicate 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Replicate 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/replicate)** 提供 Replicate API 的图像模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Replicate（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Replicate 提供商位于 `@ai-sdk/replicate` 模块，安装方式：



```bash
npm i @ai-sdk/replicate
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 用法

```ts
import { replicate } from '@ai-sdk/replicate';
import { generateImage } from 'ai';

const { image } = await generateImage({
  model: replicate.image('black-forest-labs/flux-schnell'),
  prompt: 'The Loch Ness Monster getting a manicure',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

除 prompt 外若需向模型传入其他参数，请使用 `providerOptions.replicate`：

```ts
const { image } = await generateImage({
  model: replicate.image('recraft-ai/recraft-v3'),
  prompt: 'The Loch Ness Monster getting a manicure',
  size: '1365x1024',
  providerOptions: {
    replicate: {
      style: 'realistic_image',
    },
  },
});
```

## 文档

更多信息请参阅 **[Replicate 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/replicate)**。
