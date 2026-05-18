import type { JSONObject } from '@ai-sdk/provider';
import type { InferToolInput, ToolSet } from '@ai-sdk/provider-utils';
import type { ProviderMetadata } from '../types';
import type { ValueOf } from '../util/value-of';

type BaseToolCall = {
  type: 'tool-call';
  toolCallId: string;
  providerExecuted?: boolean;
  providerMetadata?: ProviderMetadata;
  toolMetadata?: JSONObject;
};

/**
 * 一个工具调用，其`toolName`映射到声明的工具集中的一个工具，
 * 具有从该工具的输入模式推断出的“输入”类型。
 */
export type StaticToolCall<TOOLS extends ToolSet> = ValueOf<{
  [NAME in keyof TOOLS]: BaseToolCall & {
    toolName: NAME & string;
    input: InferToolInput<TOOLS[NAME]>;
    dynamic?: false | undefined;
    invalid?: false | undefined;
    error?: never;
    title?: string;
  };
}>;

/**
 * 其`toolName`只有在运行时才知道的工具调用，例如无效
 * 或其他无法与声明的工具集匹配的无类型调用。
 */
export type DynamicToolCall = BaseToolCall & {
  toolName: string;
  input: unknown;
  dynamic: true;
  title?: string;

  /**
   * 如果这是由无法解析的工具调用引起的，则为 true 或
   * 一个不存在的工具。
   */
  // 添加到 DynamicToolCall 西雅图重大更改。
  // TODO AI SDK 6：分离生成新的InvalidToolCall类型
  invalid?: boolean;

  /**
   * 导致工具调用无效的错误。
   */
  // TODO AI SDK 6：分离生成新的InvalidToolCall类型
  error?: unknown;
};

/**
 * 文本生成返回的工具调用，可以从静态类型
 * 当无法推断工具时，声明工具集或动态类型化。
 */
export type TypedToolCall<TOOLS extends ToolSet> =
  | StaticToolCall<TOOLS>
  | DynamicToolCall;
