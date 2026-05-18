# AI SDK - Kling AI 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **Kling AI 提供商** 提供 [Kling AI API](https://app.klingai.com/global/dev/document-api/quickStart/productIntroduction/overview) 的视频模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Kling AI（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Kling AI 提供商位于 `@ai-sdk/klingai` 模块，安装方式：

:

```bash
npm i @ai-sdk/klingai
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/klingai` 导入默认提供商实例 `klingai`：



```ts
import { klingai } from '@ai-sdk/klingai';
```

## Video Models

本提供商目前支持三种视频生成模式：文生视频、图生视频与动作控制。

> **Note:** Not all options are supported by every model version and mode combination. See the [KlingAI Capability Map](https://app.klingai.com/global/dev/document-api/apiReference/model/skillsMap) for detailed compatibility.

### Text-to-Video

Generate video from a text prompt.

Available models: `kling-v1-t2v`, `kling-v1.6-t2v`, `kling-v2-master-t2v`, `kling-v2.1-master-t2v`, `kling-v2.5-turbo-t2v`, `kling-v2.6-t2v`

```ts
import { klingai } from '@ai-sdk/klingai';
import { experimental_generateVideo } from 'ai';

const { videos } = await experimental_generateVideo({
  model: klingai.video('kling-v2.6-t2v'),
  prompt: 'A chicken flying into the sunset in the style of 90s anime.',
  aspectRatio: '16:9',
  duration: 5,
  providerOptions: {
    klingai: {
      mode: 'std',
    },
  },
});
```

### Image-to-Video

Generate video from a start frame image, with optional end frame control.

Available models: `kling-v1-i2v`, `kling-v1.5-i2v`, `kling-v1.6-i2v`, `kling-v2-master-i2v`, `kling-v2.1-i2v`, `kling-v2.1-master-i2v`, `kling-v2.5-turbo-i2v`, `kling-v2.6-i2v`

```ts
import { klingai } from '@ai-sdk/klingai';
import { experimental_generateVideo } from 'ai';

const { videos } = await experimental_generateVideo({
  model: klingai.video('kling-v2.6-i2v'),
  prompt: {
    image: 'https://example.com/start-frame.png',
    text: 'The cat slowly turns its head and blinks',
  },
  duration: 5,
  providerOptions: {
    klingai: {
      // Pro mode required for start+end frame control
      mode: 'pro',
      // Optional: end frame image
      imageTail: 'https://example.com/end-frame.png',
    },
  },
});
```

### Motion Control

Generate video using a reference motion video.

Available models: `kling-v2.6-motion-control`

```ts
import { klingai } from '@ai-sdk/klingai';
import { experimental_generateVideo } from 'ai';

const { videos } = await experimental_generateVideo({
  model: klingai.video('kling-v2.6-motion-control'),
  prompt: {
    image: 'https://example.com/character.png',
    text: 'The character performs a smooth dance move',
  },
  providerOptions: {
    klingai: {
      videoUrl: 'https://example.com/reference-motion.mp4',
      characterOrientation: 'image',
      mode: 'std',
    },
  },
});
```

## Provider Options

Use `providerOptions.klingai` to configure video generation. Options vary by mode:

| Option                 | T2V               | I2V               | Motion Control    | Description                     |
| ---------------------- | ----------------- | ----------------- | ----------------- | ------------------------------- |
| `mode`                 | `'std'` / `'pro'` | `'std'` / `'pro'` | `'std'` / `'pro'` | Generation quality mode         |
| `negativePrompt`       | Yes               | Yes               | —                 | What to avoid (max 2500 chars)  |
| `sound`                | V2.6+ pro only    | V2.6+ pro only    | —                 | `'on'` / `'off'` for audio      |
| `cfgScale`             | Yes (V1.x)        | Yes (V1.x)        | —                 | Prompt adherence [0, 1]         |
| `cameraControl`        | Yes               | Yes               | —                 | Camera movement presets         |
| `imageTail`            | —                 | Pro mode          | —                 | End frame image (URL or base64) |
| `staticMask`           | —                 | Yes               | —                 | Static brush mask               |
| `dynamicMasks`         | —                 | Yes               | —                 | Dynamic brush configs           |
| `videoUrl`             | —                 | —                 | Required          | Reference motion video URL      |
| `characterOrientation` | —                 | —                 | Required          | `'image'` or `'video'`          |
| `keepOriginalSound`    | —                 | —                 | Yes               | `'yes'` / `'no'`                |
| `watermarkEnabled`     | —                 | —                 | Yes               | Enable watermark                |
| `pollIntervalMs`       | Yes               | Yes               | Yes               | Poll interval (default: 5000ms) |
| `pollTimeoutMs`        | Yes               | Yes               | Yes               | Max wait (default: 600000ms)    |

各模型版本支持的功能见 [KlingAI Capability Map](https://app.klingai.com/global/dev/document-api/apiReference/model/skillsMap)。

## 身份验证

Kling AI uses access key / secret key authentication. Set the following environment variables:

```
KLINGAI_ACCESS_KEY=your-access-key
KLINGAI_SECRET_KEY=your-secret-key
```

Or pass them directly:

```ts
import { createKlingAI } from '@ai-sdk/klingai';

const klingai = createKlingAI({
  accessKey: 'your-access-key',
  secretKey: 'your-secret-key',
});
```

## 文档

更多信息请参阅 [Kling AI API 文档](https://app.klingai.com/global/dev/document-api/quickStart/productIntroduction/overview)。
