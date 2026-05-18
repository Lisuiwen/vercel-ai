# Zod 与 AI SDK

## 背景

AI SDK 允许用户直接使用 Zod 3、Zod 4 以及 Zod 4 mini schema。

错误的内部实现可能导致无限递归和 OOM 等问题，例如 [#7351](https://github.com/vercel/ai/issues/7351)。

## 规则

Zod 3 用法（仅兼容代码需要，例如解析）：

- 始终使用 `import * as z3 from "zod/v3";`

Zod 4 用法：

- 始终使用 `import * as z4 from "zod/v4";`
- 始终使用 `z4.core.$ZodType`

## 后续工作

- 配置 linter 以确保导入正确

## 相关问题

- [OOM bug report](https://github.com/vercel/ai/issues/7351)

## 参考

- [Zod library authors guide](https://zod.dev/library-authors)
