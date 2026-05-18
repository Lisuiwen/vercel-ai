# 手动测试

可使用 `/examples/ai-functions` 与 `/examples/ai-e2e-next` 下的示例进行手动测试（命令行与 Web UI）。

理想情况下，变更或新功能应覆盖以下 3 类场景：

- `generateText` 测试（命令行）
- `streamText` 测试（命令行）
- UI 测试：包含消息，以及在助手回复后的后续消息（确保结果正确回传给 LLM）

# 单元测试

## Providers

### 测试 Fixtures

对于 provider 响应解析测试，我们尽量使用来自 provider 的真实响应作为测试 fixture（若过大，可在不改变语义的前提下适当裁剪）。

fixture 存放在 `__fixtures__` 子文件夹，例如 `packages/openai/src/responses/__fixtures__`。命名约定见 `packages/openai/src/responses/__fixtures__` 中的文件名；测试 helper 设置见 `packages/openai/src/responses/openai-responses-language-model.test.ts`。

可使用 `/examples/ai-functions` 下的示例生成测试 fixture。

#### generateText

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

#### streamText

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

#### embedMany

对于 `embedMany`，记录第一个响应的原始 response body。注意 `embedMany` 返回的是 `responses`（复数，数组）而非 `response`。

```ts
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { run } from '../lib/run';

run(async () => {
  const result = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: ['sunny day at the beach', 'rainy day in the city'],
  });

  console.log(JSON.stringify(result.responses?.[0]?.body, null, 2));
});
```

嵌入向量通常过大，不宜完整存储。每个向量仅保留少量值（例如 5 个），同时保持响应结构其余部分不变。

### 在测试中加载 Fixtures

`saveRawChunks` helper 每行写入一个 JSON 对象（无 SSE 封装）。测试 chunk loader 必须重建 provider 期望的 SSE 格式。不同 provider 使用不同的 SSE 格式：

**OpenAI 风格 SSE**（openai、deepseek、groq、xai 等）使用 `data: ` 前缀与 `[DONE]` 结束标记：

```ts
function prepareChunksFixtureResponse(filename: string) {
  const chunks = fs
    .readFileSync(`src/__fixtures__/${filename}.chunks.txt`, 'utf8')
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => `data: ${line}\n\n`);
  chunks.push('data: [DONE]\n\n');

  server.urls['<api-url>'].response = {
    type: 'stream-chunks',
    chunks,
  };
}
```

**事件类型 SSE**（cohere）包含从 chunk 的 `type` 属性提取的 `event:` 字段：

```ts
function prepareChunksFixtureResponse(filename: string) {
  const chunks = fs
    .readFileSync(`src/__fixtures__/${filename}.chunks.txt`, 'utf8')
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const parsed = JSON.parse(line);
      return `event: ${parsed.type}\ndata: ${line}\n\n`;
    });

  server.urls['<api-url>'].response = {
    type: 'stream-chunks',
    chunks,
  };
}
```

查看 provider 的 `doStream` 实现，确认其使用的 `createEventSourceResponseHandler` 或 SSE 解析方式，并相应匹配 loader。
