# AI SDK - Deepgram 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Deepgram provider](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram)**
contains transcription model support for the Deepgram transcription API and speech model support for the Deepgram text-to-speech API.

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Deepgram（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Deepgram 提供商位于 `@ai-sdk/deepgram` 模块，安装方式：



```bash
npm i @ai-sdk/deepgram
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/deepgram` 导入默认提供商实例 `deepgram`：



```ts
import { deepgram } from '@ai-sdk/deepgram';
```

## 示例

### Transcription

```ts
import { deepgram } from '@ai-sdk/deepgram';
import { experimental_transcribe as transcribe } from 'ai';

const { text } = await transcribe({
  model: deepgram.transcription('nova-3'),
  audio: new URL(
    'https://github.com/vercel/ai/raw/refs/heads/main/examples/ai-functions/data/galileo.mp3',
  ),
});
```

### Transcription with Language Detection

```ts
import { deepgram } from '@ai-sdk/deepgram';
import { experimental_transcribe as transcribe } from 'ai';

const { text, language } = await transcribe({
  model: deepgram.transcription('nova-3'),
  audio: new URL(
    'https://github.com/vercel/ai/raw/refs/heads/main/examples/ai-functions/data/galileo.mp3',
  ),
  providerOptions: {
    deepgram: {
      detectLanguage: true,
    },
  },
});
```

### Text-to-Speech

```ts
import { deepgram } from '@ai-sdk/deepgram';
import { experimental_generateSpeech as generateSpeech } from 'ai';

const { audio } = await generateSpeech({
  model: deepgram.speech('aura-2-helena-en'),
  text: 'Hello, welcome to Deepgram!',
});
```

## 文档

更多信息请参阅 **[Deepgram 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram)**。
