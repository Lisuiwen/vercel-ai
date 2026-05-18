import type { ToolSet } from '@ai-sdk/provider-utils';

/**
 * 为生成步骤启用的工具名称。
 *
 * “未定义”意味着没有应用工具限制。工具名称是对象键
 * 在运行时，因此类型仅限于配置的字符串键
 * 工具集。
 */
export type ActiveTools<TOOLS extends ToolSet> =
  | ReadonlyArray<keyof TOOLS & string>
  | undefined;
