import type { Tool } from './tool';

/**
 * 推断工具的输入类型。
 */
export type InferToolInput<TOOL extends Tool<any, any, any>> =
  TOOL extends Tool<infer INPUT, any, any> ? INPUT : never;
