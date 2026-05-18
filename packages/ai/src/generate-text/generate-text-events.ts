import type {
  Context,
  InferToolSetContext,
  ProviderOptions,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { LanguageModelCallOptions } from '../prompt/language-model-call-options';
import type { TimeoutConfiguration } from '../prompt/request-options';
import type { StandardizedPrompt } from '../prompt/standardize-prompt';
import type { ToolChoice } from '../types/language-model';
import type { LanguageModelUsage } from '../types/usage';
import type { Callback } from '../util/callback';
import type { ActiveTools } from './active-tools';
import type { Output } from './output';
import type { ResponseMessage } from './response-message';
import type { StepResult } from './step-result';

/**
 * 事件传递给“onStart”回调。
 *
 * 在生成操作开始时、在任何 LLM 调用之前调用。
 */
export type GenerateTextStartEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output,
> = {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 标识操作类型（例如“ai.generateText”或“ai.streamText”）。 */
  // 移至遥测调度员
  readonly operationId: string;

  /* * 提供者标识符（例如“openai”、“anthropic”）。 */
  readonly provider: string;

  /* * 特定型号标识符（例如“gpt-4o”）。 */
  readonly modelId: string;

  /* * 本代可用的工具。 */
  readonly tools: TOOLS | undefined;

  /* * 本世代的工具选择策略。 */
  readonly toolChoice: ToolChoice<NoInfer<TOOLS>> | undefined;

  /* * 限制模型可以调用哪些工具。 */
  readonly activeTools: ActiveTools<TOOLS>;

  /* * 失败请求的最大重试次数。 */
  readonly maxRetries: number;

  /**
   * 生成的超时配置。
   * 可以是数字（毫秒）或具有totalMs、stepMs、chunkMs、toolMs 和通过工具覆盖的每个工具的对象。
   */
  readonly timeout: TimeoutConfiguration<TOOLS> | undefined;

  /* * 随请求一起发送的附加 HTTP 标头。 */
  readonly headers: Record<string, string | undefined> | undefined;

  /* * 其他特定于提供商的选项。 */
  readonly providerOptions: ProviderOptions | undefined;

  /* * 结构化输出的输出规范（如果已配置）。 */
  readonly output: OUTPUT | undefined;

  /**
   * 工具上下文。
   */
  readonly toolsContext: InferToolSetContext<TOOLS>;

  /**
   * 用户定义的运行时上下文。
   */
  readonly runtimeContext: RUNTIME_CONTEXT;
} & LanguageModelCallOptions &
  StandardizedPrompt;

/**
 * 事件传递给“onStepStart”回调。
 *
 * 在调用提供者之前，在步骤（LLM 调用）开始时调用。
 * 每个步骤代表一次 LLM 调用。
 */
export type GenerateTextStepStartEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output,
> = {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 提供者标识符（例如“openai”、“anthropic”）。 */
  readonly provider: string;

  /* * 特定型号标识符（例如“gpt-4o”）。 */
  readonly modelId: string;

  /* * 当前步骤的从零开始的索引。 */
  readonly stepNumber: number;

  /* * 本代可用的工具。 */
  readonly tools: TOOLS | undefined;

  /* * 此步骤的工具选择配置。 */
  readonly toolChoice: ToolChoice<NoInfer<TOOLS>> | undefined;

  /* * 限制可用于此步骤的工具。 */
  readonly activeTools: ActiveTools<TOOLS>;

  /* * 先前步骤的结果数组（第一步为空）。 */
  readonly steps: ReadonlyArray<StepResult<TOOLS, RUNTIME_CONTEXT>>;

  /* * 此步骤的其他特定于提供商的选项。 */
  readonly providerOptions: ProviderOptions | undefined;

  /* * 结构化输出的输出规范（如果已配置）。 */
  readonly output: OUTPUT | undefined;

  /**
   * 运行时上下文。可以在步骤之间从“prepareStep”进行更新。
   */
  readonly runtimeContext: RUNTIME_CONTEXT;

  /**
   * 工具上下文。可以在步骤之间从“prepareStep”进行更新。
   */
  readonly toolsContext: InferToolSetContext<TOOLS>;
} & StandardizedPrompt;

/**
 * 事件传递给“onStepFinish”回调。
 *
 * 当步骤（LLM 调用）完成时调用。
 * 包括该步骤的 StepResult 以及调用标识符。
 */
export type GenerateTextStepEndEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = StepResult<TOOLS, RUNTIME_CONTEXT>;

/**
 * 事件传递给“onFinish”回调。
 *
 * 当整个生成完成时调用（所有步骤完成）。
 * 包括最后一步的结果以及所有步骤的汇总数据。
 */
export type GenerateTextEndEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = Omit<StepResult<TOOLS, RUNTIME_CONTEXT>, 'performance'> & {
  /* * 通话期间生成的响应消息。 */
  readonly responseMessages: ResponseMessage[];

  /* * 包含生成中所有步骤的结果的数组。 */
  readonly steps: StepResult<TOOLS, RUNTIME_CONTEXT>[];

  /* * 所有步骤中令牌使用情况的汇总。 */
  readonly totalUsage: LanguageModelUsage;
};

/* * @deprecated 使用 `GenerateTextStartEvent` 代替。 */
export type OnStartEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output,
> = GenerateTextStartEvent<TOOLS, RUNTIME_CONTEXT, OUTPUT>;

/* * @deprecated 使用 `GenerateTextStepStartEvent` 代替。 */
export type OnStepStartEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output,
> = GenerateTextStepStartEvent<TOOLS, RUNTIME_CONTEXT, OUTPUT>;

/* * @deprecated 使用 `GenerateTextStepEndEvent` 代替。 */
export type OnStepFinishEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = GenerateTextStepEndEvent<TOOLS, RUNTIME_CONTEXT>;

/* * @deprecated 使用 `GenerateTextEndEvent` 代替。 */
export type OnFinishEvent<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = GenerateTextEndEvent<TOOLS, RUNTIME_CONTEXT>;

/**
 * 使用“experimental_onStart”选项设置的回调。
 *
 * 在generateText 操作开始时、在任何LLM 调用之前调用。
 * 使用此回调进行日志记录、分析或初始化状态
 * 一代人的开始。
 *
 * @param event - The event object containing generation configuration.
 */
export type GenerateTextOnStartCallback<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output,
> = Callback<GenerateTextStartEvent<TOOLS, RUNTIME_CONTEXT, OUTPUT>>;

/**
 * 使用“experimental_onStepStart”选项设置的回调。
 *
 * 在调用提供者之前，在步骤（LLM 调用）开始时调用。
 * 每个步骤代表一次 LLM 调用。当发生多个步骤时
 * 使用工具调用（模型可以在循环中多次调用）。
 *
 * @param event - The event object containing step configuration.
 */
export type GenerateTextOnStepStartCallback<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output,
> = Callback<GenerateTextStepStartEvent<TOOLS, RUNTIME_CONTEXT, OUTPUT>>;

/**
 * 使用“onStepFinish”选项设置的回调。
 *
 * 当步骤（LLM 调用）完成时调用。该事件包括所有步骤结果
 * 属性（文本、工具调用、用法等）以及其他元数据。
 *
 * @param stepResult - The result of the step.
 */
export type GenerateTextOnStepFinishCallback<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = Callback<GenerateTextStepEndEvent<TOOLS, RUNTIME_CONTEXT>>;

/**
 * 使用“onFinish”选项设置的回调。
 *
 * 当整个生成完成时调用（所有步骤完成）。
 * 该事件包括最后一步的结果属性以及
 * 所有步骤的汇总数据。
 *
 * @param event - The final result along with aggregated step data.
 */
export type GenerateTextOnFinishCallback<
  TOOLS extends ToolSet = ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = Callback<GenerateTextEndEvent<TOOLS, RUNTIME_CONTEXT>>;
