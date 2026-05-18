# AI SDK - Black Forest Labs 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Black Forest Labs provider](https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs)** 为 [Black Forest Labs API](https://docs.bfl.ai/) 增加图像模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Black Forest Labs（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Black Forest Labs 提供商位于 `@ai-sdk/black-forest-labs` 模块，安装方式：



```bash
pnpm add @ai-sdk/black-forest-labs
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/black-forest-labs` 导入默认提供商实例 `blackForestLabs`：



```ts
import { blackForestLabs } from '@ai-sdk/black-forest-labs';
```

## 图像生成示例

```ts
import fs from 'node:fs';
import { blackForestLabs } from '@ai-sdk/black-forest-labs';
import { generateImage } from 'ai';

const { image } = await generateImage({
  model: blackForestLabs.image('flux-pro-1.1'),
  prompt: 'A cat wearing a intricate robe',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

## 其他选项

If you want to pass additional inputs to the model besides the prompt, use the `providerOptions.blackForestLabs` property:

```ts
import {
  blackForestLabs,
  type BlackForestLabsImageProviderOptions,
} from '@ai-sdk/black-forest-labs';
import { generateImage } from 'ai';

const { image } = await generateImage({
  model: blackForestLabs.image('flux-pro-1.1'),
  prompt: 'A cat wearing an intricate robe',
  aspectRatio: '16:9',
  providerOptions: {
    blackForestLabs: {
      outputFormat: 'png',
    } satisfies BlackForestLabsImageProviderOptions,
  },
});
```

## 配置 Base URL

默认使用 `https://api.bfl.ai/v1`，可按需覆盖为区域或旧版端点：

```ts
import { createBlackForestLabs } from '@ai-sdk/black-forest-labs';

const blackForestLabs = createBlackForestLabs({
  baseURL: 'https://api.eu.bfl.ai/v1',
  apiKey: process.env.BFL_API_KEY,
});
```

## Configuring Polling

可自定义客户端轮询图像完成状态的频率与超时时间：

```ts
import { createBlackForestLabs } from '@ai-sdk/black-forest-labs';

const blackForestLabs = createBlackForestLabs({
  apiKey: process.env.BFL_API_KEY,
  // Poll every 500ms, timeout after 5 minutes
  pollIntervalMillis: 500,
  pollTimeoutMillis: 5 * 60_000,
});
```

也可通过 `providerOptions.blackForestLabs` 按请求覆盖轮询设置：

```ts
import { blackForestLabs } from '@ai-sdk/black-forest-labs';
import { generateImage } from 'ai';

const { image } = await generateImage({
  model: blackForestLabs.image('flux-pro-1.1'),
  prompt: 'A cat wearing an intricate robe',
  providerOptions: {
    blackForestLabs: {
      pollIntervalMillis: 250,
      pollTimeoutMillis: 30_000,
    },
  },
});
```

## 文档

更多信息见 [Black Forest Labs 提供商](https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs)。
