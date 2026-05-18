import {
  validateTypes,
  type Context,
  type Experimental_Sandbox as Sandbox,
  type ModelMessage,
  type ToolSet,
} from '@ai-sdk/provider-utils';
import { generateText } from '../generate-text/generate-text';
import type {
  GenerateTextOnStartCallback,
  GenerateTextOnStepStartCallback,
} from '../generate-text/generate-text-events';
import type { GenerateTextResult } from '../generate-text/generate-text-result';
import type { Output } from '../generate-text/output';
import { isStepCount } from '../generate-text/stop-condition';
import { streamText } from '../generate-text/stream-text';
import type { StreamTextResult } from '../generate-text/stream-text-result';
import type { Prompt } from '../prompt';
import { mergeCallbacks } from '../util/merge-callbacks';
import type {
  Agent,
  AgentCallParameters,
  AgentStreamParameters,
} from './agent';
import type { ToolLoopAgentSettings } from './tool-loop-agent-settings';

/**
 * 工具循环代理是在循环中运行工具的代理。在每一步中，
 * 它调用LLM，如果有工具调用，它会执行工具
 * 并在新的步骤中使用工具结果再次调用法学硕士。
 *
 * 循环继续直到：
 * - 返回除工具调用之外的完成推理，或者
 * - 调用的工具没有执行函数，或者
 * - 工具调用需要通过`toolApproval`或工具级`needsApproval`批准，或者
 * - 满足停止条件（默认停止条件为isStepCount(20)）
 */
export class ToolLoopAgent<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = never,
> implements Agent<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT, OUTPUT> {
  readonly version = 'agent-v1';

  private readonly settings: ToolLoopAgentSettings<
    CALL_OPTIONS,
    TOOLS,
    RUNTIME_CONTEXT,
    OUTPUT
  >;

  constructor(
    settings: ToolLoopAgentSettings<
      CALL_OPTIONS,
      TOOLS,
      RUNTIME_CONTEXT,
      OUTPUT
    >,
  ) {
    this.settings = settings;
  }

  /**
   * 代理的ID。
   */
  get id(): string | undefined {
    return this.settings.id;
  }

  /**
   * 代理可以使用的工具。
   */
  get tools(): TOOLS {
    return this.settings.tools as TOOLS;
  }

  private async prepareCall(options: {
    prompt?: string | Array<ModelMessage>;
    messages?: Array<ModelMessage>;
    options?: CALL_OPTIONS;
    experimental_sandbox?: Sandbox;
  }): Promise<
    Omit<
      ToolLoopAgentSettings<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT, OUTPUT>,
      | 'prepareCall'
      | 'instructions'
      | 'experimental_onStart'
      | 'experimental_onStepStart'
      | 'onToolExecutionStart'
      | 'onToolExecutionEnd'
      | 'onStepFinish'
      | 'onFinish'
    > &
      Prompt
  > {
    if (
      this.settings.callOptionsSchema != null &&
      options.options !== undefined
    ) {
      const validatedOptions = await validateTypes({
        value: options.options,
        schema: this.settings.callOptionsSchema,
        context: { field: 'options' },
      });
      options = { ...options, options: validatedOptions };
    }

    const {
      experimental_onStart: _settingsOnStart,
      experimental_onStepStart: _settingsOnStepStart,
      onToolExecutionStart: _settingsOnToolExecutionStart,
      onToolExecutionEnd: _settingsOnToolExecutionEnd,
      onStepFinish: _settingsOnStepFinish,
      onFinish: _settingsOnFinish,
      ...settingsWithoutCallbacks
    } = this.settings;

    const baseCallArgs = {
      ...settingsWithoutCallbacks,
      stopWhen: this.settings.stopWhen ?? isStepCount(20),
      ...options,
    };

    const preparedCallArgs =
      (await this.settings.prepareCall?.(
        baseCallArgs as Parameters<
          NonNullable<
            ToolLoopAgentSettings<
              CALL_OPTIONS,
              TOOLS,
              RUNTIME_CONTEXT,
              OUTPUT
            >['prepareCall']
          >
        >[0],
      )) ?? baseCallArgs;

    const { instructions, messages, prompt, runtimeContext, ...callArgs } =
      preparedCallArgs;

    const promptArgs = { instructions, messages, prompt } as Prompt;

    if (runtimeContext === undefined) {
      return {
        ...callArgs,
        ...promptArgs,
      };
    }

    return {
      ...callArgs,
      runtimeContext,
      ...promptArgs,
    };
  }

  /**
   * 从代理生成输出（非流式传输）。
   */
  async generate({
    abortSignal,
    timeout,
    experimental_sandbox: sandbox,
    experimental_onStart,
    experimental_onStepStart,
    onToolExecutionStart,
    onToolExecutionEnd,
    onStepFinish,
    onFinish,
    ...options
  }: AgentCallParameters<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT>): Promise<
    GenerateTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>
  > {
    const generate = generateText<TOOLS, RUNTIME_CONTEXT, OUTPUT>;
    const preparedCall = await this.prepareCall({
      ...options,
      experimental_sandbox: sandbox,
    });
    const callbackArgs = {
      abortSignal,
      timeout,
      experimental_sandbox: sandbox,
      experimental_onStart: mergeCallbacks(
        this.settings.experimental_onStart,
        experimental_onStart as
          | GenerateTextOnStartCallback<TOOLS, RUNTIME_CONTEXT, OUTPUT>
          | undefined,
      ),
      experimental_onStepStart: mergeCallbacks(
        this.settings.experimental_onStepStart,
        experimental_onStepStart as
          | GenerateTextOnStepStartCallback<TOOLS, RUNTIME_CONTEXT, OUTPUT>
          | undefined,
      ),
      onToolExecutionStart: mergeCallbacks(
        this.settings.onToolExecutionStart,
        onToolExecutionStart,
      ),
      onToolExecutionEnd: mergeCallbacks(
        this.settings.onToolExecutionEnd,
        onToolExecutionEnd,
      ),
      onStepFinish: mergeCallbacks(this.settings.onStepFinish, onStepFinish),
      onFinish: mergeCallbacks(this.settings.onFinish, onFinish),
    };

    return await generate({
      ...preparedCall,
      ...callbackArgs,
    } as unknown as Parameters<typeof generate>[0]);
  }

  /**
   * 对代理的输出进行流式传输（流式传输）。
   */
  async stream({
    abortSignal,
    timeout,
    experimental_sandbox: sandbox,
    experimental_transform,
    experimental_onStart,
    experimental_onStepStart,
    onToolExecutionStart,
    onToolExecutionEnd,
    onStepFinish,
    onFinish,
    ...options
  }: AgentStreamParameters<CALL_OPTIONS, TOOLS, RUNTIME_CONTEXT>): Promise<
    StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>
  > {
    const stream = streamText<TOOLS, RUNTIME_CONTEXT, OUTPUT>;
    const preparedCall = await this.prepareCall({
      ...options,
      experimental_sandbox: sandbox,
    });
    const callbackArgs = {
      abortSignal,
      timeout,
      experimental_sandbox: sandbox,
      experimental_transform,
      experimental_onStart: mergeCallbacks(
        this.settings.experimental_onStart,
        experimental_onStart as
          | GenerateTextOnStartCallback<TOOLS, RUNTIME_CONTEXT, OUTPUT>
          | undefined,
      ),
      experimental_onStepStart: mergeCallbacks(
        this.settings.experimental_onStepStart,
        experimental_onStepStart as
          | GenerateTextOnStepStartCallback<TOOLS, RUNTIME_CONTEXT, OUTPUT>
          | undefined,
      ),
      onToolExecutionStart: mergeCallbacks(
        this.settings.onToolExecutionStart,
        onToolExecutionStart,
      ),
      onToolExecutionEnd: mergeCallbacks(
        this.settings.onToolExecutionEnd,
        onToolExecutionEnd,
      ),
      onStepFinish: mergeCallbacks(this.settings.onStepFinish, onStepFinish),
      onFinish: mergeCallbacks(this.settings.onFinish, onFinish),
    };

    return await stream({
      ...preparedCall,
      ...callbackArgs,
    } as unknown as Parameters<typeof stream>[0]);
  }
}
