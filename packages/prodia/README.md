# AI SDK - Prodia 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Prodia 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/prodia)** 为 [Prodia API](https://docs.prodia.com/) 增加图像模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Prodia（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Prodia 提供商位于 `@ai-sdk/prodia` 模块，安装方式：



```bash
pnpm add @ai-sdk/prodia
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/prodia` 导入默认提供商实例 `prodia`：



```ts
import { prodia } from '@ai-sdk/prodia';
```

## 图像生成示例

```ts
import fs from 'node:fs';
import { prodia } from '@ai-sdk/prodia';
import { generateImage } from 'ai';

const { image } = await generateImage({
  model: prodia.image('inference.flux-fast.schnell.txt2img.v2'),
  prompt: 'A cat wearing a intricate robe',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

## 其他选项

除 prompt 外若需向模型传入其他参数，请使用 `providerOptions.prodia`：

```ts
import { prodia, type ProdiaImageProviderOptions } from '@ai-sdk/prodia';
import { generateImage } from 'ai';

const { image } = await generateImage({
  model: prodia.image('inference.flux-fast.schnell.txt2img.v2'),
  prompt: 'A cat wearing an intricate robe',
  providerOptions: {
    prodia: {
      width: 1024,
      height: 1024,
      steps: 4,
    } satisfies ProdiaImageProviderOptions,
  },
});
```

## 配置 Base URL

默认使用 `https://inference.prodia.com/v2`，可按需覆盖：

```ts
import { createProdia } from '@ai-sdk/prodia';

const prodia = createProdia({
  baseURL: 'https://inference.prodia.com/v2',
  apiKey: process.env.PRODIA_TOKEN,
});
```

## 文档

更多信息见 [Prodia 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/prodia)。
