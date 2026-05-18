import type { Context } from './context';
import type { ModelMessage } from './model-message';

/**
 * 调用该函数以确定工具在执行之前是否需要批准。
 *
 * @deprecated 工具批准现在在“generateText”/“streamText”级别上处理。
 */
export type ToolNeedsApprovalFunction<
  INPUT,
  CONTEXT extends Context | unknown | never,
> = (
  input: INPUT,
  options: {
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
  },
) => boolean | PromiseLike<boolean>;
