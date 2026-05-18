import type { Context } from './context';
import type { ModelMessage } from './model-message';
import type { Experimental_Sandbox as Sandbox } from './sandbox';

/**
 * 发送到每个工具执行中的其他选项。
 */
export interface ToolExecutionOptions<
  CONTEXT extends Context | unknown | never,
> {
  /**
   * 工具调用的 ID。您可以使用它，例如当使用流数据发送工具调用相关信息时。
   */
  toolCallId: string;

  /**
   * 发送到语言模型以启动包含工具调用的响应的消息。
   * 这些消息**不**包括系统提示或包含工具调用的助手响应。
   */
  messages: ModelMessage[];

  /**
   * 可选的中止信号，指示应中止整个操作。
   */
  abortSignal?: AbortSignal;

  /**
   * 由工具的上下文架构定义的工具上下文。
   * 工具上下文特定于工具并传递给工具执行。
   *
   * 将上下文对象视为工具内部不可变的。
   * 改变上下文对象可能会导致竞争条件和意外结果
   * 当并行调用工具时。
   *
   * 如果需要改变上下文，请分析工具调用和结果
   * 在`prepareStep`中并在那里更新它。
   */
  context: CONTEXT;

  /**
   * 该工具运行的沙箱环境。
   */
  experimental_sandbox?: Sandbox;
}

/**
 * 执行该工具并返回单个结果或结果流的函数。
 */
export type ToolExecuteFunction<
  INPUT,
  OUTPUT,
  CONTEXT extends Context | unknown | never,
> = (
  input: INPUT,
  options: ToolExecutionOptions<CONTEXT>,
) => AsyncIterable<OUTPUT> | PromiseLike<OUTPUT> | OUTPUT;
