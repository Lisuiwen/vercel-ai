# AI SDK - Amazon Bedrock 提供商

面向 [AI SDK](https://ai-sdk.dev/docs) 的 **[Amazon Bedrock provider](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock)**
提供 Amazon Bedrock [converse API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html) 的语言模型支持。

> **部署到 Vercel？** 通过 Vercel AI Gateway 可访问 Amazon Bedrock（以及数百个其他提供商的模型）——无需额外安装包、API Key 或额外费用。[开始使用 AI Gateway](https://vercel.com/ai-gateway)。

## 安装

Amazon Bedrock 提供商位于 `@ai-sdk/amazon-bedrock` 模块，安装方式：



```bash
npm i @ai-sdk/amazon-bedrock
```

## 编码代理 Skill

若你使用 Claude Code、Cursor 等编码代理，强烈建议在仓库中添加 AI SDK skill：

```shell
npx skills add vercel/ai
```

## 提供商实例

可从 `@ai-sdk/amazon-bedrock` 导入默认提供商实例 `bedrock`：



```ts
import { bedrock } from '@ai-sdk/amazon-bedrock';
```

## 身份验证

Amazon Bedrock 提供商支持两种身份验证方式，并自动回退：

### API Key 身份验证（推荐）

相比传统 AWS SigV4，API Key 身份验证配置更简单，可通过环境变量或直接配置完成。

#### 使用环境变量

将 API Key 设置为环境变量 `AWS_BEARER_TOKEN_BEDROCK`：

```bash
export AWS_BEARER_TOKEN_BEDROCK=your-api-key-here
```

```ts
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';

const { text } = await generateText({
  model: bedrock('anthropic.claude-3-haiku-20240307-v1:0'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  // API key is automatically loaded from AWS_BEARER_TOKEN_BEDROCK
});
```

#### 使用直接配置

也可在提供商配置中直接传入 API Key：

```ts
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';

const bedrockWithApiKey = bedrock.withSettings({
  apiKey: process.env.AWS_BEARER_TOKEN_BEDROCK, // or your API key directly
  region: 'us-east-1', // Optional: specify region
});

const { text } = await generateText({
  model: bedrockWithApiKey('anthropic.claude-3-haiku-20240307-v1:0'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

### SigV4 身份验证（回退）

未提供 API Key 时，提供商将自动回退到使用标准 AWS 凭证的 SigV4 身份验证：

```ts
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';

// Uses AWS credentials from environment variables or AWS credential chain
const { text } = await generateText({
  model: bedrock('anthropic.claude-3-haiku-20240307-v1:0'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

此方式需要标准 AWS 环境变量：

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` （可选，用于临时凭证）

### 身份验证 Precedence

提供商按以下优先级选择身份验证方式：

1. **直接配置中的 API Key**（`withSettings()` 中的 `apiKey`）
2. **环境变量中的 API Key**（`AWS_BEARER_TOKEN_BEDROCK`）
3. **SigV4 身份验证**（AWS 凭证链回退）

## 示例

```ts
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';

const { text } = await generateText({
  model: bedrock('meta.llama3-8b-instruct-v1:0'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## 文档

更多信息请参阅 **[Amazon Bedrock 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock)**。
