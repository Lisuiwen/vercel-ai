import type { Tool } from './tool';

/**
 * 保证公开执行函数的工具。
 */
export type ExecutableTool<TOOL extends Tool = Tool> = TOOL & {
  execute: NonNullable<TOOL['execute']>;
};

/**
 * 检查工具是否公开执行函数。
 */
export function isExecutableTool<TOOL extends Tool>(
  tool: TOOL | undefined,
): tool is ExecutableTool<TOOL> {
  return tool != null && typeof tool.execute === 'function';
}
