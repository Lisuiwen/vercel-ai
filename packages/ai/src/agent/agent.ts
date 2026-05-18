import type {
  Arrayable,
  Context,
  Experimental_Sandbox as Sandbox,
  ModelMessage,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type {
  GenerateTextOnFinishCallback,
  GenerateTextOnStartCallback,
  GenerateTextOnStepFinishCallback,
  GenerateTextOnStepStartCallback,
} from '../generate-text/generate-text-events';
import type { GenerateTextResult } from '../generate-text/generate-text-result';
import type { Output } from '../generate-text/output';
import type { StreamTextTransform } from '../generate-text/stream-text';
import type { StreamTextResult } from '../generate-text/stream-text-result';
import type {
  OnToolExecutionEndCallback,
  OnToolExecutionStartCallback,
} from '../generate-text/tool-execution-events';
import type { TimeoutConfiguration } from '../prompt/request-options';

/**
 * 呼叫座席参数。
 */
export type AgentCallParameters<
  CALL_OPTIONS,
  TOOLS extends ToolSet = {},
  RUNTIME_CONTEXT extends Context = Context,
> = ([CALL_OPTIONS] extends [never]
  ? { options?: never }
  : { options: CALL_OPTIONS }) &
  (
    | {
        /**
         * 一个提示。它可以是文本提示或消息列表。
         *
         * 您可以使用“提示”或“消息”，但不能同时使用两者。
         */
        prompt: string | Array<ModelMessage>;

        /**
         * 消息列表。
         *
         * 您可以使用“提示”或“消息”，但不能同时使用两者。
         */
        messages?: never;
      }
    | {
        /**
         * 消息列表。
         *
         * 您可以使用“提示”或“消息”，但不能同时使用两者。
         */
        messages: Array<ModelMessage>;

        /**
         * 一个提示。它可以是文本提示或消息列表。
         *
         * 您可以使用“提示”或“消息”，但不能同时使用两者。
         */
        prompt?: never;
      }
  ) & {
    /**
     * 中止信号。
     */
    abortSignal?: AbortSignal;

    /**
     * 超时（以毫秒为单位）。可以用`totalMs`指定为数字或对象。
     */
    timeout?: TimeoutConfiguration<TOOLS>;

    /**
     * 代理操作开始时、任何LLM调用之前调用的回调。
     */
    experimental_onStart?: GenerateTextOnStartCallback<TOOLS, RUNTIME_CONTEXT>;

    /**
     * 在调用提供程序之前，步骤（LLM调用）开始时调用的回调。
     */
    experimental_onStepStart?: GenerateTextOnStepStartCallback<
      TOOLS,
      RUNTIME_CONTEXT
    >;

    /**
     * 在每个工具执行开始之前调用的回调。
     */
    onToolExecutionStart?: OnToolExecutionStartCallback<TOOLS>;

    /**
     * 每个工具执行完成后调用的回调。
     */
    onToolExecutionEnd?: OnToolExecutionEndCallback<TOOLS>;

    /**
     * 每个步骤（LLM调用）完成时调用的回调，包括中间步骤。
     */
    onStepFinish?: GenerateTextOnStepFinishCallback<TOOLS, RUNTIME_CONTEXT>;

    /**
     * 当所有步骤完成并且响应完成时调用的回调。
     */
    onFinish?: GenerateTextOnFinishCallback<TOOLS, RUNTIME_CONTEXT>;

    /**
     * 传递到工具执行的沙箱环境。
     */
    experimental_sandbox?: Sandbox;
  };

/**
 * 用于流式传输代理输出的参数。
 */
export type AgentStreamParameters<
  CALL_OPTIONS,
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = AgentCallParameters<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT> & {
  /**
   * 可选的流转换。
   * 它们按照提供的顺序应用。
   * 流转换必须维护流结构，streamText才能正常工作。
   */
  experimental_transform?: Arrayable<StreamTextTransform<TOOLS>>;
};

/**
 * 代理接收提示（文本或消息）并生成或流式传输输出
 * 由步骤、工具调用、数据部分等组成。
 *
 * 您可以通过实现`Agent`接口来实现您自己的Agent，
 * 或使用`ToolLoopAgent`类。
 */
export interface Agent<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = never,
> {
  /**
   * 代理接口的规范版本。这将使
   * 我们改进代理接口并保持向后兼容性。
   */
  readonly version: 'agent-v1';

  /**
   * 代理的ID。
   */
  readonly id: string | undefined;

  /**
   * 代理可以使用的工具。
   */
  readonly tools: TOOLS;

  /**
   * 从代理生成输出（非流式传输）。
   */
  generate(
    options: AgentCallParameters<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT>,
  ): PromiseLike<GenerateTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>>;

  /**
   * 对代理的输出进行流式传输（流式传输）。
   */
  stream(
    options: AgentStreamParameters<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT>,
  ): PromiseLike<StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>>;
}
