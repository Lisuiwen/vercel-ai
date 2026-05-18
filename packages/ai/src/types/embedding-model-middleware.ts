import type { EmbeddingModelV4Middleware } from '@ai-sdk/provider';

/**
 * 用于嵌入模型的中间件。
 * 接受V3和V4中间件类型以实现兼容。
 *
 * 使用 EmbeddingModelV4Middleware 作为基础，但放宽了规范版本
 * 接受任何字符串（包括`v3`）并自定义。
 */
export type EmbeddingModelMiddleware = Omit<
  EmbeddingModelV4Middleware,
  'specificationVersion'
> & {
  readonly specificationVersion?: string;
};
