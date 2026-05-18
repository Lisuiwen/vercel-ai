import type {
  Context,
  InferToolContext,
  InferToolInput,
  InferToolSetContext,
  MaybePromiseLike,
  ModelMessage,
  ToolExecutionOptions,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { TypedToolCall } from './tool-call';

/**
 * 工具配置的批准状态。这可以是以下之一：
 *
 * -“不适用”：该工具不需要批准。
 * -“已批准”：该工具自动获得批准。
 * -“拒绝”：该工具被自动拒绝。
 * -“用户批准”：该工具需要用户批准。
 *
 * 除了字符串状态之外，您还可以使用带有原因属性的对象状态。
 *
 * “未定义”被视为“不适用”状态。
 */
export type ToolApprovalStatus =
  | undefined
  | 'not-applicable'
  | 'approved'
  | 'denied'
  | 'user-approval'
  | { type: 'not-applicable'; reason?: never }
  | { type: 'approved'; reason?: string }
  | { type: 'denied'; reason?: string }
  | { type: 'user-approval'; reason?: never };

/**
 * 调用该函数以确定工具在执行之前是否需要批准。
 *
 * 返回“未定义”与“不适用”状态具有相同的效果。
 */
// 参数与 ToolExecuteFunction 类似（除了中止信号）
export type SingleToolApprovalFunction<
  INPUT,
  TOOL_CONTEXT extends Context | unknown | never,
  RUNTIME_CONTEXT extends Context | unknown | never,
> = (
  input: INPUT,
  options: Omit<
    ToolExecutionOptions<TOOL_CONTEXT>,
    'abortSignal' | 'context'
  > & {
    toolContext: TOOL_CONTEXT;
    runtimeContext: RUNTIME_CONTEXT;
  },
) => MaybePromiseLike<ToolApprovalStatus>;

/**
 * 调用该函数以确定工具调用在执行之前是否需要批准。
 *
 * 返回“未定义”与“不适用”状态具有相同的效果。
 */
export type GenericToolApprovalFunction<
  TOOLS extends ToolSet,
  TOOLS_CONTEXT extends InferToolSetContext<TOOLS>,
  RUNTIME_CONTEXT extends Context | unknown | never,
> = (options: {
  /**
   * 需要批准的工具调用。
   */
  toolCall: TypedToolCall<TOOLS>;

  /**
   * 可供模型调用的所有工具。
   */
  tools: TOOLS | undefined;

  /**
   * 可供模型调用的所有工具的工具上下文。
   */
  toolsContext: TOOLS_CONTEXT;

  /**
   * 运行时上下文。
   */
  runtimeContext: RUNTIME_CONTEXT;

  /**
   * 发送到语言模型以启动包含工具调用的响应的消息。
   * 这些消息**不**包括系统提示或包含工具调用的助手响应。
   */
  messages: ModelMessage[];
}) => MaybePromiseLike<ToolApprovalStatus>;

/**
 * 配置单个工具是否需要批准才能运行。
 *
 * 您可以使用为所有工具调用调用的通用函数，
 * 或者您可以使用每个工具的功能。
 *
 * 对于每个工具的功能，每个工具都可以分配一个批准状态
 * 或在运行时生成批准状态的函数。
 *
 * 批准状态可以是以下之一：
 * -“不适用”：该工具不需要批准。
 * -“已批准”：该工具自动获得批准。
 * -“拒绝”：该工具被自动拒绝。
 * -“用户批准”：该工具需要用户批准。
 *
 * 除了字符串状态之外，您还可以使用带有原因属性的对象状态。
 */
export type ToolApprovalConfiguration<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context | unknown | never,
> =
  | GenericToolApprovalFunction<
      TOOLS,
      InferToolSetContext<TOOLS>,
      RUNTIME_CONTEXT
    >
  | {
      [key in keyof TOOLS]?:
        | ToolApprovalStatus
        | SingleToolApprovalFunction<
            InferToolInput<TOOLS[key]>,
            InferToolContext<TOOLS[key]>,
            RUNTIME_CONTEXT
          >;
    };
