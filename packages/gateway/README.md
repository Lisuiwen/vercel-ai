# AI SDK - Gateway 提供商

[AI SDK](https://ai-sdk.dev/docs) 的 Gateway 提供商可访问多种 AI 模型与提供商。

## 安装

Gateway 提供商位于 `@ai-sdk/gateway` 模块，安装方式：



```bash
npm i @ai-sdk/gateway
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/gateway` 导入默认提供商实例 `gateway`：



```ts
import { gateway } from '@ai-sdk/gateway';
```

## 示例

```ts
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

const { text } = await generateText({
  model: gateway('xai/grok-3-beta'),
  prompt:
    'Tell me about the history of the San Francisco Mission-style burrito.',
});
```

## 文档

更多信息请参阅 [AI SDK 文档](https://ai-sdk.dev/docs)。
