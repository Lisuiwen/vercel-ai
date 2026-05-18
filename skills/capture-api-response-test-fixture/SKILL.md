---
name: capture-api-response-test-fixture
description: 捕获 API 响应测试 fixture。
metadata:
  internal: true
---

### API 响应测试 Fixtures

对于 provider 响应解析测试，我们尽量使用来自 provider 的真实响应作为测试 fixture（若过大，可在不改变语义的前提下适当裁剪）。

fixture 存放在 `__fixtures__` 子文件夹，例如 `packages/openai/src/responses/__fixtures__`。命名约定见 `packages/openai/src/responses/__fixtures__` 中的文件名；测试 helper 设置见 `packages/openai/src/responses/openai-responses-language-model.test.ts`。

可使用 `/examples/ai-functions` 下的示例生成测试 fixture。

#### generateText（doGenerate 测试）

对于 `generateText`，将原始响应输出记录到控制台，并复制到新的测试 fixture。

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { run } from '../lib/run';

run(async () => {
  const result = await generateText({
    model: openai('gpt-5-nano'),
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  console.log(JSON.stringify(result.response.body, null, 2));
});
```

#### streamText（doStream 测试）

对于 `streamText`，需将 `includeRawChunks` 设为 `true`，并使用专用的 `saveRawChunks` helper。在 `/example/ai-functions` 文件夹中通过 `pnpm tsx src/stream-text/script-name.ts` 运行脚本。结果保存在 `/examples/ai-functions/output` 文件夹。可复制到 fixture 文件夹并重命名。

```ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { run } from '../lib/run';
import { saveRawChunks } from '../lib/save-raw-chunks';

run(async () => {
  const result = streamText({
    model: openai('gpt-5-nano'),
    prompt: 'Invent a new holiday and describe its traditions.',
    includeRawChunks: true,
  });

  await saveRawChunks({ result, filename: 'openai-gpt-5-nano' });
});
```
