import type { Tool } from './tool';

/**
 * 工具名称到工具定义的映射。
 */
export type ToolSet = Record<
  string,
  (
    | Tool<never, never, any>
    | Tool<any, any, any>
    | Tool<any, never, any>
    | Tool<never, any, any>
  ) &
    Pick<
      Tool<any, any, any>,
      | 'execute'
      | 'onInputAvailable'
      | 'onInputStart'
      | 'onInputDelta'
      | 'needsApproval'
    >
>;
