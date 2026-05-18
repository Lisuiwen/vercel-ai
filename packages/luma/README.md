# AI SDK - Luma 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **Luma 提供商** 支持 Luma AI 最先进的图像生成模型 Photon 与 Photon Flash。

## About Luma Photon Models

Luma Photon and Photon Flash are groundbreaking image generation models that deliver:

- Ultra-high quality image generation
- 10x higher cost efficiency compared to similar models
- Superior prompt understanding and adherence
- Unique character consistency capabilities from single reference images
- Multi-image reference support for precise style matching

有关 Luma 模型与能力的更多详情，请访问 [Luma AI](https://lumalabs.ai/)。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Luma（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Luma 提供商位于 `@ai-sdk/luma` 模块，安装方式：

:

```bash
npm i @ai-sdk/luma
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/luma` 导入默认提供商实例 `luma`：



```ts
import { luma } from '@ai-sdk/luma';
```

## 图像生成示例

```ts
import { luma } from '@ai-sdk/luma';
import { generateImage } from 'ai';
import fs from 'fs';

const { image } = await generateImage({
  model: luma.image('photon-1'),
  prompt: 'A serene mountain landscape at sunset',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

## 文档

更多信息请参阅 **[Luma 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/luma)**。
