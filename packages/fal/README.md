# AI SDK - fal 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[fal provider](https://ai-sdk.dev/providers/ai-sdk-providers/fal)** contains image model support for the [fal.ai API](https://fal.ai/).

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 fal（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

fal 提供商位于 `@ai-sdk/fal` 模块，安装方式：



```bash
npm i @ai-sdk/fal
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/fal` 导入默认提供商实例 `fal`：



```ts
import { fal } from '@ai-sdk/fal';
```

## 图像生成示例

```ts
import { fal } from '@ai-sdk/fal';
import { generateImage } from 'ai';
import fs from 'fs';
const { image } = await generateImage({
  model: fal.image('fal-ai/flux/schnell'),
  prompt: 'A cat wearing a intricate robe',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

## 其他选项

If you want to pass additional inputs to the model besides the prompt, use the `providerOptions.fal` property:

```ts
const { image } = await generateImage({
  model: fal.image('fal-ai/recraft-v3'),
  prompt: 'A cat wearing a intricate robe',
  size: '1920x1080',
  providerOptions: {
    fal: {
      style: 'digital_illustration',
    },
  },
});
```

## 文档

更多信息请参阅 **[fal 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/fal)**。
