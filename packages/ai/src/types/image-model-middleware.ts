import type { ImageModelV4Middleware } from '@ai-sdk/provider';

/**
 * 图像模型的中间件。
 * 接受V3和V4中间件类型以实现兼容。
 *
 * 使用 ImageModelV4Middleware 作为基础，但放宽了规范版本
 * 接受任何字符串（包括`v3`）并自定义。
 */
export type ImageModelMiddleware = Omit<
  ImageModelV4Middleware,
  'specificationVersion'
> & {
  readonly specificationVersion?: string;
};
