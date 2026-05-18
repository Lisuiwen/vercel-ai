import type { Agent } from './agent';

/**
 * 推断代理工具的类型。
 */
export type InferAgentTools<AGENT> =
  AGENT extends Agent<any, infer TOOLS, any> ? TOOLS : never;
