import type { ImageModelV4Middleware } from '@ai-sdk/provider';

/**
 * 图像模型的中间件。
 * 接受 V3 和 V4 中间件类型以实现向后兼容性。
 *
 * 使用 ImageModelV4Middleware 作为基础，但放宽了规范版本
 * 接受任何字符串（包括“v3”）并使其可选。
 */
export type ImageModelMiddleware = Omit<
  ImageModelV4Middleware,
  'specificationVersion'
> & {
  readonly specificationVersion?: string;
};
