import type { Tool } from './tool';

/**
 * 推断工具的输出类型。
 */
export type InferToolOutput<TOOL extends Tool<any, any, any>> =
  TOOL extends Tool<any, infer OUTPUT, any> ? OUTPUT : never;
