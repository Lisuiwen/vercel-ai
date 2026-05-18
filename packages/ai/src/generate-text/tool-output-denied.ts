import type { ValueOf } from '../util/value-of';
import type { ToolSet } from '@ai-sdk/provider-utils';

/**
 * 工具执行被拒绝时的工具输出（对于静态工具）。
 */
export type StaticToolOutputDenied<TOOLS extends ToolSet> = ValueOf<{
  [NAME in keyof TOOLS]: {
    type: 'tool-output-denied';
    toolCallId: string;
    toolName: NAME & string;
    providerExecuted?: boolean;
    dynamic?: false | undefined;
  };
}>;

/**
 * 工具执行被拒绝时的工具输出。
 */
export type TypedToolOutputDenied<TOOLS extends ToolSet> =
  StaticToolOutputDenied<TOOLS>;
