import type {
  InferToolContext,
  ModelMessage,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { Callback } from '../util/callback';
import type { DynamicToolCall, StaticToolCall } from './tool-call';
import type { ToolOutput } from './tool-output';
import type { ValueOf } from '../util/value-of';

/**
 * 解析单个工具的上下文类型，当
 * 工具未声明`contextSchema`。
 */
type ToolContextFor<TOOL extends ToolSet[keyof ToolSet]> = [
  InferToolContext<TOOL>,
] extends [never]
  ? undefined
  : InferToolContext<TOOL>;

type BaseToolExecutionStartFields = {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /**
   * 发送到语言模型以启动包含工具调用的响应的消息。
   * 这些消息**不**包括系统提示或包含工具调用的助手响应。
   */
  readonly messages: ModelMessage[];
};

/**
 * 静态已知工具的精确启动事件联合。
 *
 * 每个联合成员将一个特定的`toolCall.toolName`与该工具的
 * 已验证的`toolContext`类型。
 */
type StaticToolExecutionStartEvent<TOOLS extends ToolSet> = ValueOf<{
  [NAME in keyof TOOLS]: BaseToolExecutionStartFields & {
    readonly toolCall: Extract<StaticToolCall<TOOLS>, { toolName: NAME }>;
    readonly toolContext: ToolContextFor<TOOLS[NAME]>;
  };
}>;

/**
 * 动态或无类型工具调用的启动事件形状。
 */
type DynamicToolExecutionStartEvent = BaseToolExecutionStartFields & {
  readonly toolCall: DynamicToolCall;
  readonly toolContext: unknown;
};

/**
 * 用于默认`ToolSet`专业化的广泛启动事件形状。
 *
 * 当调用者不使用时，这使得通用收集器符合人体工程学
 * 一个具体的工具集，因此不能从每个工具的缩小中受益。
 */
type WidenedToolExecutionStartEvent = BaseToolExecutionStartFields & {
  readonly toolCall: StaticToolCall<ToolSet> | DynamicToolCall;
  readonly toolContext: unknown;
};

/**
 * 事件传递给`onToolExecutionStart`回调。
 *
 * 在工具执行开始时、调用之前调用工具的`execute`函数。
 */
export type ToolExecutionStartEvent<TOOLS extends ToolSet = ToolSet> = [
  ToolSet,
] extends [TOOLS]
  ? WidenedToolExecutionStartEvent
  : StaticToolExecutionStartEvent<TOOLS> | DynamicToolExecutionStartEvent;

type BaseToolExecutionEndFields = {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 工具调用的执行时间（以毫秒为单位）。 */
  readonly toolExecutionMs: number;

  /**
   * 发送到语言模型以启动包含工具调用的响应的消息。
   * 这些消息**不**包括系统提示或包含工具调用的助手响应。
   */
  readonly messages: ModelMessage[];
};

/**
 * 静态已知工具的精确结束事件联合。
 *
 * 每个联合成员都保留`toolCall.toolName`之间的链接，
 * 回复已验证的`toolContext`，以及工具执行结果。
 */
type StaticToolExecutionEndEvent<TOOLS extends ToolSet> = ValueOf<{
  [NAME in keyof TOOLS]: BaseToolExecutionEndFields & {
    readonly toolCall: Extract<StaticToolCall<TOOLS>, { toolName: NAME }>;
    readonly toolContext: ToolContextFor<TOOLS[NAME]>;
    readonly toolOutput: ToolOutput<TOOLS>;
  };
}>;

/**
 * 动态或无类型工具调用的结束事件形状。
 */
type DynamicToolExecutionEndEvent<TOOLS extends ToolSet> =
  BaseToolExecutionEndFields & {
    readonly toolCall: DynamicToolCall;
    readonly toolContext: unknown;
    readonly toolOutput: ToolOutput<TOOLS>;
  };

/**
 * 用于默认`ToolSet`专业化的广泛结束事件形状。
 *
 * 这为通用消费者提供了一个可分配的包罗万象的事件类型，同时
 * 具体工具专业化保留了每个工具的完整缩小范围。
 */
type WidenedToolExecutionEndEvent = BaseToolExecutionEndFields & {
  readonly toolCall: StaticToolCall<ToolSet> | DynamicToolCall;
  readonly toolContext: unknown;
  readonly toolOutput: ToolOutput<ToolSet>;
};

/**
 * 事件传递给`onToolExecutionEnd`回调。
 *
 * 当工具执行成功或有错误完成时调用。
 * 使用`toolOutput.type`判别器来区分成功和错误。
 */
export type ToolExecutionEndEvent<TOOLS extends ToolSet = ToolSet> = [
  ToolSet,
] extends [TOOLS]
  ? WidenedToolExecutionEndEvent
  : StaticToolExecutionEndEvent<TOOLS> | DynamicToolExecutionEndEvent<TOOLS>;

/**
 * 使用`onToolExecutionStart`选项设置回调。
 *
 * 在工具执行开始时、调用之前调用工具的`execute`函数。
 * 使用它来记录工具调用、跟踪工具使用情况或预执行验证。
 *
 * @param event - 包含工具调用信息的事件对象。
 */
export type OnToolExecutionStartCallback<TOOLS extends ToolSet = ToolSet> =
  Callback<ToolExecutionStartEvent<TOOLS>>;

/**
 * 使用`onToolExecutionEnd`选项设置的回调。
 *
 * 当工具执行成功或有错误完成时调用。
 * 使用它来记录工具结果、跟踪执行时间或错误处理。
 *
 * 该事件在`toolOutput.type`上使用可区分联合：
 * - 当`toolOutput.type === 'tool-result'`时：`toolOutput.output`包含工具结果。
 * - 当`t​​oolOutput.type === 'tool-error'`时：`toolOutput.error`包含错误。
 *
 * @param event - 包含工具调用结果信息的事件对象。
 */
export type OnToolExecutionEndCallback<TOOLS extends ToolSet = ToolSet> =
  Callback<ToolExecutionEndEvent<TOOLS>>;

/* * @deprecated 使用 `ToolExecutionStartEvent` 代替。 */
export type OnToolCallStartEvent<TOOLS extends ToolSet = ToolSet> =
  ToolExecutionStartEvent<TOOLS>;

/* * @deprecated 使用 `ToolExecutionEndEvent` 代替。 */
export type OnToolCallFinishEvent<TOOLS extends ToolSet = ToolSet> =
  ToolExecutionEndEvent<TOOLS>;
