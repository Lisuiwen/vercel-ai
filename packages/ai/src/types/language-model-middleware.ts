import type { LanguageModelV4Middleware } from '@ai-sdk/provider';

/**
 * 语言模型的中间件。
 * 接受V3和V4中间件类型以实现兼容。
 *
 * 使用 LanguageModelV4Middleware 作为基础，但放宽了规范版本
 * 接受任何字符串（包括`v3`）并自定义。
 */
export type LanguageModelMiddleware = Omit<
  LanguageModelV4Middleware,
  'specificationVersion'
> & {
  readonly specificationVersion?: string;
};
