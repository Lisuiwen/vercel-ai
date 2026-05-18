# AI 函数示例

本目录包含脚本与测试套件，便于快速验证、测试与迭代各提供商的 `ai` 函数。

## 基础示例

面向 `ai` 函数的基础示例（脚本用法）。

### 用法

1. 创建 `.env` 文件，内容如下（并按需添加其他提供商相关配置）：

```sh
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
...
```

2. 在 AI SDK 仓库根目录执行：

```sh
pnpm install
pnpm build
```

3. 在 `examples/ai-functions` 目录下运行任意示例：

```sh
pnpm tsx src/path/to/example.ts
```

## 端到端提供商集成测试

`src/e2e` 下有端到端提供商集成测试。这些测试不在 CI 中运行，仅手动执行。失败可能由配额限制、厂商侧变更、凭证缺失或过期等外部原因导致。

目的是让 AI SDK 开发者能方便地对常见功能做冒烟测试；可通过过滤只跑部分用例。多数端到端用例在 `src` 相应子目录中也有基础示例脚本对应。

```sh
pnpm run test:e2e:all
```

或单个文件：

```sh
pnpm run test:file src/e2e/google.test.ts
```

过滤部分测试用例：

```sh
pnpm run test:file src/e2e/google.test.ts -t stream
```
