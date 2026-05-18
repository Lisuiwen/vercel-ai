# Codemods

我们强烈建议使用 AI 模型为你的变更创建 codemod，例如使用 [Cursor](https://cursor.com) 与 `claude-4-sonnet`。

以下说明有助于 AI 模型产出更好的结果：

```md
- Start all input/output fixtures files with `// @ts-nocheck`. Make sure the comment remains in place in the output fixture file.
- Update `packages/codemod/src/lib/upgrade.ts`
- Use `import { createTransformer } from './lib/create-transformer';` for codemods. Do not import anything from `jscodeshift` directly.
- No need to cover imports that use `require()`
- The codemod should not return anything. It should set `context.hasChanges` to `true` instead.
- See files in `packages/codemod/src/codemods` for conventions
- Multiple input/output files can be used in case of import conflicts.
- Run tests to verify the change
- Run the codemod manually to verify that it's working
- If you need to create temporary files for testing, create them in `packages/codemod/`, and remove them when done.
```

根据变更复杂度，可指示 AI 直接审阅 pull request 中的变更，例如 https://github.com/vercel/ai/pull/5750.diff。若无用，可像下方示例那样描述破坏性变更。

## 示例

````md
# Breaking change

## `streamtext()`: `result.file.{mediaType,data}` properties is now `result.{mediaType,data}`

Before:

```ts
import { streamText } from 'ai';

const result = await streamText({
  model: someModel,
  prompt: 'Generate an image',
});

for await (const delta of result.fullStream) {
  switch (delta.type) {
    case 'file': {
      console.log('Media type:', delta.file.mediaType);
      console.log('File data:', delta.file.data);
      break;
    }
  }
}
```

After:

```ts
import { streamText } from 'ai';

const result = await streamText({
  model: someModel,
  prompt: 'Generate an image',
});

for await (const delta of result.fullStream) {
  switch (delta.type) {
    case 'file': {
      console.log('Media type:', delta.mediaType);
      console.log('File data:', delta.data);
      break;
    }
  }
}
```
````
