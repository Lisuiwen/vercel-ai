import type {
  LanguageModelV4Content,
  LanguageModelV4GenerateResult,
  LanguageModelV4ToolCall,
} from '@ai-sdk/provider';
import {
  asArray,
  createIdGenerator,
  getErrorMessage,
  withUserAgentSuffix,
  type Arrayable,
  type Context,
  type Experimental_Sandbox as Sandbox,
  type IdGenerator,
  type InferToolSetContext,
  type ProviderOptions,
  type ToolSet,
} from '@ai-sdk/provider-utils';
import { NoOutputGeneratedError } from '../error';
import { ToolCallNotFoundForApprovalError } from '../error/tool-call-not-found-for-approval-error';
import { logWarnings } from '../logger/log-warnings';
import { resolveLanguageModel } from '../model/resolve-model';
import type { ModelMessage } from '../prompt';
import { cloneModelMessages } from '../prompt/clone-model-message';
import { convertToLanguageModelPrompt } from '../prompt/convert-to-language-model-prompt';
import { createToolModelOutput } from '../prompt/create-tool-model-output';
import type { LanguageModelCallOptions } from '../prompt/language-model-call-options';
import { prepareLanguageModelCallOptions } from '../prompt/prepare-language-model-call-options';
import { prepareToolChoice } from '../prompt/prepare-tool-choice';
import { prepareTools } from '../prompt/prepare-tools';
import type { Prompt } from '../prompt/prompt';
import {
  getStepTimeoutMs,
  getTotalTimeoutMs,
  type RequestOptions,
  type TimeoutConfiguration,
} from '../prompt/request-options';
import { standardizePrompt } from '../prompt/standardize-prompt';
import { wrapGatewayError } from '../prompt/wrap-gateway-error';
import type { Telemetry } from '../telemetry/telemetry';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import type {
  LanguageModel,
  LanguageModelRequestMetadata,
  ToolChoice,
} from '../types';
import {
  addLanguageModelUsage,
  asLanguageModelUsage,
  type LanguageModelUsage,
} from '../types/usage';
import type { DownloadFunction } from '../util/download/download-function';
import { mergeAbortSignals } from '../util/merge-abort-signals';
import { mergeObjects } from '../util/merge-objects';
import { now as originalNow } from '../util/now';
import { notify } from '../util/notify';
import { prepareRetries } from '../util/prepare-retries';
import { setAbortTimeout } from '../util/set-abort-timeout';
import { VERSION } from '../version';
import type { ActiveTools } from './active-tools';
import { calculateTokensPerSecond } from './calculate-tokens-per-second';
import { collectToolApprovals } from './collect-tool-approvals';
import type { ContentPart } from './content-part';
import { executeToolCall } from './execute-tool-call';
import {
  filterActiveTools,
  type ActiveToolSubset,
} from './filter-active-tools';
import type {
  GenerateTextOnFinishCallback,
  GenerateTextOnStartCallback,
  GenerateTextOnStepFinishCallback,
  GenerateTextOnStepStartCallback,
} from './generate-text-events';
import type { GenerateTextResult } from './generate-text-result';
import { DefaultGeneratedFile } from './generated-file';
import type {
  OnLanguageModelCallEndCallback,
  OnLanguageModelCallStartCallback,
} from './language-model-events';
import { text, type Output } from './output';
import type { InferCompleteOutput } from './output-utils';
import { parseToolCall } from './parse-tool-call';
import type { PrepareStepFunction } from './prepare-step';
import { convertToReasoningOutputs } from './reasoning-output';
import { resolveToolApproval } from './resolve-tool-approval';
import type { ResponseMessage } from './response-message';
import { createRestrictedTelemetryDispatcher } from './restricted-telemetry-dispatcher';
import {
  DefaultStepResult,
  type StepResult,
  type StepResultPerformance,
} from './step-result';
import {
  isStepCount,
  isStopConditionMet,
  type StopCondition,
} from './stop-condition';
import { sumTokenCounts } from './sum-token-counts';
import { toResponseMessages } from './to-response-messages';
import type { ToolApprovalConfiguration } from './tool-approval-configuration';
import type { ToolApprovalRequestOutput } from './tool-approval-request-output';
import type { ToolApprovalResponseOutput } from './tool-approval-response-output';
import type { TypedToolCall } from './tool-call';
import type { ToolCallRepairFunction } from './tool-call-repair-function';
import type { TypedToolError } from './tool-error';
import type {
  OnToolExecutionEndCallback,
  OnToolExecutionStartCallback,
} from './tool-execution-events';
import type { ToolInputRefinement } from './tool-input-refinement';
import type { ToolOutput } from './tool-output';
import type { TypedToolResult } from './tool-result';
import type { ToolsContextParameter } from './tools-context-parameter';

const originalGenerateId = createIdGenerator({
  prefix: 'aitxt',
  size: 24,
});

const originalGenerateCallId = createIdGenerator({
  prefix: 'call',
  size: 24,
});

export type GenerateTextInclude = {
  /**
   * 是否在步骤结果中保留请求正文。
   * 发送图像或文件时，请求正文可能很大。
   *
   * @default false
   */
  requestBody?: boolean;

  /**
   * 是否保留步骤结果中的请求消息。
   * 发送图像或文件时，请求消息可能很大。
   *
   * @default false
   */
  requestMessages?: boolean;

  /**
   * 是否在步骤结果中保留响应正文。
   *
   * @default false
   */
  responseBody?: boolean;
};

/**
 * 使用语言模型为给定提示生成文本并调用工具。
 *
 * 此函数不是流式输出。如果您想流式传输输出，请改用`streamText`。
 *
 * @param model - 要使用的语言模型。
 *
 * @param tools - 模型可以访问并调用的工具。模型需要支持调用工具。
 * @param toolChoice - 工具选择策略。默认值：`自动`。
 *
 * @param system - 将作为提示的一部分的系统消息。
 * @param prompt - 一个简单的文字提示。您可以使用`提示`或`消息`，但不能同时使用两者。
 * @param messages - 消息列表。您可以使用`提示`或`消息`，但不能同时使用两者。
 * @param allowSystemInMessages - `提示`或`消息`字段中是否允许系统消息。默认值：假。
 *
 * @param maxOutputTokens - 生成的最大令牌数。
 * @param temperature - 温度设定。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置`温度`或`topP`，但不能同时设置两者。
 * @param topP - 细胞核取样。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置`温度`或`topP`，但不能同时设置两者。
 * @param topK - 对于每个后续标记，仅从前 K 个选项中进行采样。
 * 用于删除“长尾”低概率响应。
 * 仅推荐用于高级用例。通常您只需要使用温度。
 * @param presencePenalty - 存在惩罚设置。
 * 它会影响模型重复提示中已有信息的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param frequencyPenalty - 频率惩罚设置。
 * 它影响模型重复使用相同单词或短语的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param stopSequences - 停止序列。
 * 如果设置，模型将在生成停止序列之一时停止生成文本。
 * @param seed - 用于随机采样的种子（整数）。
 * 如果模型设置并支持，调用将生成确定性结果。
 *
 * @param maxRetries - 最大重试次数。设置为 0 以禁用重试。默认值：2。
 * @param abortSignal - 可用于取消调用的可选中止信号。
 * @param timeout - 可选超时（以毫秒为单位）。如果调用时间超过指定的超时时间，调用将被中止。
 * @param headers - 与请求一起发送的附加 HTTP 标头。仅适用于基于 HTTP 的提供商。
 *
 * @param experimental_sandbox - 传递到工具执行的沙箱环境。
 * @param runtimeContext - 用户定义的运行时上下文贯穿整个生成生命周期。
 * @param experimental_refineToolInput - 工具名称到函数的可选映射，用于在执行工具之前以及记录输出、回调和遥测之前细化已解析的工具输入。
 * @param experimental_onStart - 生成开始时、任何 LLM 调用之前调用的回调。
 * @param experimental_onStepStart - 每个步骤开始时、调用提供程序之前都会调用回调。
 * 接收步骤号、消息（采用ModelMessage格式）、工具和运行时上下文。
 * @param onToolExecutionStart - 在每个工具执行开始之前调用回调。
 * 接收工具名称、调用ID、输入和上下文。
 * @param experimental_onToolCallStart - 已弃用`onToolExecutionStart`的别名。
 * @param onToolExecutionEnd - 每个工具执行完成后调用的回调。
 * 使用可区分联合：检查“成功”以确定是否存在“输出”或“错误”。
 * @param experimental_onToolCallFinish - 已弃用`onToolExecutionEnd`的别名。
 * @param onStepFinish - 每个步骤（LLM 调用）完成时调用的回调，包括中间步骤。
 * @param onFinish - 当所有步骤完成并且响应完成时调用的回调。
 *
 * @返回
 * 一个结果对象，包含生成的文本、工具调用的结果以及附加信息。
 */
export async function generateText<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output<string, string>,
>({
  model: modelArg,
  tools,
  toolChoice,
  instructions,
  system,
  prompt,
  messages,
  allowSystemInMessages,
  maxRetries: maxRetriesArg,
  abortSignal,
  timeout,
  headers,
  stopWhen = isStepCount(1),
  experimental_sandbox: sandbox,
  output,
  toolApproval,
  experimental_telemetry,
  telemetry = experimental_telemetry,
  providerOptions,
  activeTools,
  prepareStep,
  experimental_repairToolCall: repairToolCall,
  experimental_refineToolInput: refineToolInput,
  experimental_download: download,
  runtimeContext = {} as RUNTIME_CONTEXT,
  toolsContext = {} as InferToolSetContext<TOOLS>,
  experimental_include,
  include = experimental_include,
  _internal: {
    generateId = originalGenerateId,
    generateCallId = originalGenerateCallId,
    now = originalNow,
  } = {},
  experimental_onStart: onStart,
  experimental_onStepStart: onStepStart,
  experimental_onLanguageModelCallStart: onLanguageModelCallStart,
  experimental_onLanguageModelCallEnd: onLanguageModelCallEnd,
  onToolExecutionStart,
  onToolExecutionEnd,
  experimental_onToolCallStart,
  experimental_onToolCallFinish,
  onStepFinish,
  onFinish,
  ...settings
}: LanguageModelCallOptions &
  RequestOptions<TOOLS> &
  Prompt &
  ToolsContextParameter<TOOLS> & {
    /**
     * 要使用的语言模型。
     */
    model: LanguageModel;

    /**
     * 工具选择策略。默认值：“自动”。
     */
    toolChoice?: ToolChoice<NoInfer<TOOLS>>;

    /**
     * 最后一步有工具结果时停止生成的条件。
     * 当条件是数组时，满足任何一个条件都可以停止生成。
     *
     * @default isStepCount(1)
     */
    stopWhen?: Arrayable<StopCondition<NoInfer<TOOLS>, RUNTIME_CONTEXT>>;

    /**
     * 可选遥测配置。
     */
    telemetry?: TelemetryOptions<RUNTIME_CONTEXT, NoInfer<TOOLS>>;

    /**
     * 可选遥测配置。
     *
     * @deprecated 请改用`遥测`。该别名将在未来的主要版本中删除。
     */
    experimental_telemetry?: TelemetryOptions<RUNTIME_CONTEXT, NoInfer<TOOLS>>;

    /**
     * 其他特定于提供商的选项。他们通过
     * 从AI SDK发送给成功并实现特定的成功
     * 可以完全封装在提供者中的功能。
     */
    providerOptions?: ProviderOptions;

    /**
     * 传递到工具执行的沙箱环境。
     */
    experimental_sandbox?: Sandbox;

    /**
     * 运行时上下文。将运行时上下文视为不可变。
     * 如果您需要改变运行时上下文，请在`prepareStep`中更新它。
     */
    runtimeContext?: RUNTIME_CONTEXT;

    /**
     * 限制模型可以调用的工具，无需
     * 更改结果中的工具调用和结果类型。
     */
    activeTools?: ActiveTools<NoInfer<TOOLS>>;

    /**
     * 用于解析LLM响应的构造输出的任选规范。
     */
    output?: OUTPUT;

    /**
     * 可选工具审批配置。
     *
     * 此配置优先于工具定义的批准设置。
     */
    toolApproval?: ToolApprovalConfiguration<TOOLS, RUNTIME_CONTEXT>;

    /**
     * 使用URL的自定义下载功能。
     *
     * 默认情况下，如果模型不支持给定媒体类型的URL，则下载文件。
     */
    experimental_download?: DownloadFunction | undefined;

    /**
     * 您可以使用可选函数为步骤提供不同的设置。
     */
    prepareStep?: PrepareStepFunction<NoInfer<TOOLS>, RUNTIME_CONTEXT>;

    /**
     * 尝试修复无法解析的工具调用的函数。
     */
    experimental_repairToolCall?: ToolCallRepairFunction<NoInfer<TOOLS>>;

    /**
     * 工具名称到优化已解析工具输入的函数的可选映射。
     *
     * 精炼输入必须与工具输入具有相同的类型形状。精致
     * 输入用于工具执行、输出、回调和遥测。
     */
    experimental_refineToolInput?: ToolInputRefinement<NoInfer<TOOLS>>;

    /**
     * generateText操作开始时调用的回调，
     * 在拨打任何LLM电话之前。
     */
    experimental_onStart?: GenerateTextOnStartCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>,
      NoInfer<OUTPUT>
    >;

    /**
     * 步骤（LLM调用）开始时调用的回调，
     * 在调用提供者之前。
     */
    experimental_onStepStart?: GenerateTextOnStepStartCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>,
      NoInfer<OUTPUT>
    >;

    /**
     * 在提供者模型调用开始之前立即调用的回调。
     */
    experimental_onLanguageModelCallStart?: OnLanguageModelCallStartCallback;

    /**
     * 模型响应标准化和解析后调用的回调，
     * 但在任何客户端工具执行开始之前。
     */
    experimental_onLanguageModelCallEnd?: OnLanguageModelCallEndCallback<
      NoInfer<TOOLS>
    >;

    /**
     * 在工具的执行函数运行之前调用的回调。
     */
    onToolExecutionStart?: OnToolExecutionStartCallback<NoInfer<TOOLS>>;

    /**
     * 在工具的执行函数运行之前调用的回调。
     *
     * @deprecated 请改用`onToolExecutionStart`。
     */
    experimental_onToolCallStart?: OnToolExecutionStartCallback<NoInfer<TOOLS>>;

    /**
     * 在工具的执行函数完成（或出错）后立即调用的回调。
     */
    onToolExecutionEnd?: OnToolExecutionEndCallback<NoInfer<TOOLS>>;

    /**
     * 在工具的执行函数完成（或出错）后立即调用的回调。
     *
     * @deprecated 请改用`onToolExecutionEnd`。
     */
    experimental_onToolCallFinish?: OnToolExecutionEndCallback<NoInfer<TOOLS>>;

    /**
     * 每个步骤（LLM调用）完成时调用的回调，包括中间步骤。
     */
    onStepFinish?: GenerateTextOnStepFinishCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>
    >;

    /**
     * 当所有步骤完成并且响应完成时调用的回调。
     */
    onFinish?: GenerateTextOnFinishCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>
    >;

    /**
     * 用于控制步骤结果中包含哪些数据的设置。
     * 禁用包含可以帮助减少处理时的内存使用量
     * 图像等大型有效负载。
     *
     * 默认情况下，请求正文、请求消息和响应正文是
     * 排除。
     */
    include?: GenerateTextInclude;

    /**
     * 用于控制步骤结果中包含哪些数据的设置。
     *
     * @deprecated 请改用`包含`。
     */
    experimental_include?: GenerateTextInclude;

    /**
     * 内部的。仅供测试使用。可能会更改，恕不另行通知。
     */
    _internal?: {
      generateId?: IdGenerator;
      generateCallId?: IdGenerator;
      now?: () => number;
    };
  }): Promise<GenerateTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>> {
  // 分配默认值以包括：
  include = {
    requestBody: include?.requestBody ?? false,
    requestMessages: include?.requestMessages ?? false,
    responseBody: include?.responseBody ?? false,
  };

  const model = resolveLanguageModel(modelArg);
  const stopConditions = asArray(stopWhen);
  const resolvedOnToolExecutionStart =
    onToolExecutionStart ?? experimental_onToolCallStart;
  const resolvedOnToolExecutionEnd =
    onToolExecutionEnd ?? experimental_onToolCallFinish;

  const totalTimeoutMs = getTotalTimeoutMs(timeout);
  const stepTimeoutMs = getStepTimeoutMs(timeout);
  const stepAbortController =
    stepTimeoutMs != null ? new AbortController() : undefined;
  const mergedAbortSignal = mergeAbortSignals(
    abortSignal,
    totalTimeoutMs,
    stepAbortController?.signal,
  );

  const { maxRetries, retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal: mergedAbortSignal,
  });

  const callSettings = prepareLanguageModelCallOptions(settings);

  const headersWithUserAgent = withUserAgentSuffix(
    headers ?? {},
    `ai/${VERSION}`,
  );

  const initialPrompt = await standardizePrompt({
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
  } as Prompt);

  const callId = generateCallId();

  const telemetryDispatcher = createRestrictedTelemetryDispatcher<
    TOOLS,
    RUNTIME_CONTEXT,
    OUTPUT
  >({
    telemetry,
    includeRuntimeContext: telemetry?.includeRuntimeContext,
    includeToolsContext: telemetry?.includeToolsContext,
  });

  await notify({
    event: {
      callId,
      operationId: 'ai.generateText',
      provider: model.provider,
      modelId: model.modelId,
      instructions: initialPrompt.instructions,
      messages: initialPrompt.messages,
      tools,
      toolChoice,
      activeTools,
      maxOutputTokens: callSettings.maxOutputTokens,
      temperature: callSettings.temperature,
      topP: callSettings.topP,
      topK: callSettings.topK,
      presencePenalty: callSettings.presencePenalty,
      frequencyPenalty: callSettings.frequencyPenalty,
      stopSequences: callSettings.stopSequences,
      seed: callSettings.seed,
      reasoning: callSettings.reasoning,
      maxRetries,
      timeout,
      headers: headersWithUserAgent,
      providerOptions,
      output,
      runtimeContext,
      toolsContext,
    },
    callbacks: [onStart, telemetryDispatcher.onStart],
  });

  try {
    const initialMessages = initialPrompt.messages;
    const initialResponseMessages: Array<ResponseMessage> = [];

    const { approvedToolApprovals, deniedToolApprovals } =
      collectToolApprovals<TOOLS>({ messages: initialMessages });

    const localApprovedToolApprovals = approvedToolApprovals.filter(
      toolApproval => !toolApproval.toolCall.providerExecuted,
    );

    if (
      deniedToolApprovals.length > 0 ||
      localApprovedToolApprovals.length > 0
    ) {
      const toolResults = await executeTools({
        toolCalls: localApprovedToolApprovals.map(
          toolApproval => toolApproval.toolCall,
        ),
        tools: tools as TOOLS,
        callId,
        messages: initialMessages,
        abortSignal: mergedAbortSignal,
        timeout,
        experimental_sandbox: sandbox,
        toolsContext,
        onToolExecutionStart: event =>
          notify({
            event,
            callbacks: [
              resolvedOnToolExecutionStart,
              telemetryDispatcher.onToolExecutionStart,
            ],
          }),
        onToolExecutionEnd: event =>
          notify({
            event,
            callbacks: [
              resolvedOnToolExecutionEnd,
              telemetryDispatcher.onToolExecutionEnd,
            ],
          }),
        executeToolInTelemetryContext: telemetryDispatcher.executeTool,
      });

      const toolContent: Array<any> = [];

      // 为批准的工具调用添加常规工具结果：
      for (const result of toolResults) {
        const output = result.output;
        const modelOutput = await createToolModelOutput({
          toolCallId: output.toolCallId,
          input: output.input,
          tool: tools?.[output.toolName],
          output: output.type === 'tool-result' ? output.output : output.error,
          errorMode: output.type === 'tool-error' ? 'text' : 'none',
        });

        toolContent.push({
          type: 'tool-result' as const,
          toolCallId: output.toolCallId,
          toolName: output.toolName,
          output: modelOutput,
        });
      }

      // 为所有被拒绝的工具批准添加执行被拒绝的工具结果：
      for (const toolApproval of deniedToolApprovals) {
        toolContent.push({
          type: 'tool-result' as const,
          toolCallId: toolApproval.toolCall.toolCallId,
          toolName: toolApproval.toolCall.toolName,
          output: {
            type: 'execution-denied' as const,
            reason: toolApproval.approvalResponse.reason,
            // 对于项目执行的工具，请包含approvalId，以便项目可以关联
            ...(toolApproval.toolCall.providerExecuted && {
              providerOptions: {
                openai: {
                  approvalId: toolApproval.approvalResponse.approvalId,
                },
              },
            }),
          },
        });
      }

      initialResponseMessages.push({
        role: 'tool',
        content: toolContent,
      });
    }

    const callSettings = prepareLanguageModelCallOptions(settings);

    let currentModelResponse: LanguageModelV4GenerateResult & {
      response: { id: string; timestamp: Date; modelId: string };
    };
    let clientToolCalls: Array<TypedToolCall<TOOLS>> = [];
    let clientToolOutputs: Array<ToolOutput<TOOLS>> = [];
    let toolApprovalResponses: Array<ToolApprovalResponseOutput<TOOLS>> = [];
    let deniedToolApprovalResponses: Array<ToolApprovalResponseOutput<TOOLS>> =
      [];
    const steps: GenerateTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>['steps'] =
      [];
    let instructionsForNextStep = initialPrompt.instructions;
    let messagesForNextStep = [...initialMessages, ...initialResponseMessages];

    // 跟踪提供者执行的支持延迟结果的工具调用
    // （例如，Smashing Tool 调用场景中的 code_execution）。
    // 这些工具可能不会在调用的同时返回结果。
    const pendingDeferredToolCalls = new Map<string, { toolName: string }>();

    do {
      // 如果已配置，请设置步骤超时
      const stepTimeoutId = setAbortTimeout({
        abortController: stepAbortController,
        label: 'Step',
        timeoutMs: stepTimeoutMs,
      });

      try {
        const accumulatedResponseMessages = [
          ...initialResponseMessages,
          ...steps.flatMap(step => step.response.messages),
        ];
        const stepInputMessages = messagesForNextStep;

        const prepareStepResult = await prepareStep?.({
          model,
          steps,
          stepNumber: steps.length,
          instructions: instructionsForNextStep,
          initialInstructions: initialPrompt.instructions,
          messages: stepInputMessages,
          initialMessages,
          responseMessages: accumulatedResponseMessages,
          runtimeContext,
          toolsContext,
          experimental_sandbox: sandbox,
        });

        const stepSandbox = prepareStepResult?.experimental_sandbox ?? sandbox;

        const stepModel = resolveLanguageModel(
          prepareStepResult?.model ?? model,
        );

        const stepInstructions =
          prepareStepResult?.instructions ??
          prepareStepResult?.system ??
          instructionsForNextStep;

        const promptMessages = await convertToLanguageModelPrompt({
          prompt: {
            instructions: stepInstructions,
            messages: prepareStepResult?.messages ?? stepInputMessages,
          },
          supportedUrls: await stepModel.supportedUrls,
          download,
          provider: stepModel.provider.split('.')[0],
        });

        runtimeContext = prepareStepResult?.runtimeContext ?? runtimeContext;
        toolsContext = prepareStepResult?.toolsContext ?? toolsContext;

        const stepActiveTools = filterActiveTools({
          tools,
          activeTools: prepareStepResult?.activeTools ?? activeTools,
        });

        const stepTools = await prepareTools({
          tools: stepActiveTools,
          // 活动工具上下文是工具上下文的子集，因此我们可以转换为未知类型
          toolsContext: toolsContext as unknown as InferToolSetContext<
            ActiveToolSubset<TOOLS, ActiveTools<NoInfer<TOOLS>>>
          >,
          experimental_sandbox: stepSandbox,
        });

        const stepToolChoice = prepareToolChoice({
          toolChoice: prepareStepResult?.toolChoice ?? toolChoice,
        });

        const stepMessages = prepareStepResult?.messages ?? stepInputMessages;

        const stepProviderOptions = mergeObjects(
          providerOptions,
          prepareStepResult?.providerOptions,
        );
        const stepNumber = steps.length;

        await notify({
          event: {
            callId,
            provider: stepModel.provider,
            modelId: stepModel.modelId,
            stepNumber,
            instructions: stepInstructions,
            messages: stepMessages,
            tools,
            toolChoice: prepareStepResult?.toolChoice ?? toolChoice,
            activeTools: prepareStepResult?.activeTools ?? activeTools,
            steps: [...steps],
            providerOptions: stepProviderOptions,
            output,
            runtimeContext,
            promptMessages,
            stepTools,
            stepToolChoice,
            toolsContext,
          },
          callbacks: [onStepStart, telemetryDispatcher.onStepStart],
        });

        await notify({
          event: {
            callId,
            provider: stepModel.provider,
            modelId: stepModel.modelId,
            instructions: stepInstructions,
            messages: stepMessages,
            tools: stepTools,
            ...callSettings,
          },
          callbacks: [
            onLanguageModelCallStart,
            telemetryDispatcher.onLanguageModelCallStart as
              | undefined
              | OnLanguageModelCallStartCallback,
          ],
        });

        const stepStartTimestampMs = now();

        currentModelResponse = await retry(async () => {
          const result = await stepModel.doGenerate({
            ...callSettings,
            tools: stepTools,
            toolChoice: stepToolChoice,
            responseFormat: await output?.responseFormat,
            prompt: promptMessages,
            providerOptions: stepProviderOptions,
            abortSignal: mergedAbortSignal,
            headers: headersWithUserAgent,
          });

          const responseData = {
            id: result.response?.id ?? generateId(),
            timestamp: result.response?.timestamp ?? new Date(),
            modelId: result.response?.modelId ?? stepModel.modelId,
            headers: result.response?.headers,
            body: result.response?.body,
          };

          return { ...result, response: responseData };
        });
        const responseTimeMs = now() - stepStartTimestampMs;
        const stepUsage = asLanguageModelUsage(currentModelResponse.usage);

        // 解析工具调用：
        const stepToolCalls: TypedToolCall<TOOLS>[] = await Promise.all(
          currentModelResponse.content
            .filter(
              (part): part is LanguageModelV4ToolCall =>
                part.type === 'tool-call',
            )
            .map(toolCall =>
              parseToolCall({
                toolCall,
                tools,
                repairToolCall,
                refineToolInput,
                instructions: stepInstructions,
                messages: stepMessages,
              }),
            ),
        );
        const toolApprovalRequests: Record<
          string,
          ToolApprovalRequestOutput<TOOLS>
        > = {};
        const stepToolApprovalResponses: Record<
          string,
          ToolApprovalResponseOutput<TOOLS>
        > = {};
        const blockedToolCallIds = new Set<string>();

        const modelCallContent = asContent({
          content: currentModelResponse.content,
          toolCalls: stepToolCalls,
          toolOutputs: [],
          toolApprovalRequests: [],
          toolApprovalResponses: [],
          tools,
        });

        await notify({
          event: {
            callId,
            provider: stepModel.provider,
            modelId: stepModel.modelId,
            finishReason: currentModelResponse.finishReason.unified,
            usage: stepUsage,
            content: modelCallContent,
            responseId: currentModelResponse.response.id,
            performance: {
              responseTimeMs,
              effectiveOutputTokensPerSecond: calculateTokensPerSecond({
                tokens: stepUsage.outputTokens,
                durationMs: responseTimeMs,
              }),
              outputTokensPerSecond: undefined,
              inputTokensPerSecond: undefined,
              effectiveTotalTokensPerSecond: calculateTokensPerSecond({
                tokens: sumTokenCounts(
                  stepUsage.inputTokens,
                  stepUsage.outputTokens,
                ),
                durationMs: responseTimeMs,
              }),
              timeToFirstOutputTokenMs: undefined,
            },
          },
          callbacks: [
            onLanguageModelCallEnd,
            telemetryDispatcher.onLanguageModelCallEnd as
              | undefined
              | OnLanguageModelCallEndCallback<TOOLS>,
          ],
        });

        // 通知工具该工具调用可用：
        for (const toolCall of stepToolCalls) {
          if (toolCall.invalid) {
            continue; // 忽略无效的工具调用
          }

          const tool = tools?.[toolCall.toolName];

          if (tool == null) {
            // 忽略对不可用工具的工具调用，
            // 例如提供商执行的动态工具
            continue;
          }

          if (tool?.onInputAvailable != null) {
            await tool.onInputAvailable({
              input: toolCall.input,
              toolCallId: toolCall.toolCallId,
              messages: stepMessages,
              abortSignal: mergedAbortSignal,
              context: runtimeContext,
            });
          }

          const toolApprovalStatus = await resolveToolApproval({
            tools,
            toolApproval,
            toolCall,
            messages: stepMessages,
            toolsContext,
            runtimeContext,
          });

          switch (toolApprovalStatus.type) {
            case 'user-approval': {
              toolApprovalRequests[toolCall.toolCallId] = {
                type: 'tool-approval-request',
                approvalId: generateId(),
                toolCall,
              };
              blockedToolCallIds.add(toolCall.toolCallId);
              break;
            }

            case 'approved': {
              const approvalId = generateId();

              toolApprovalRequests[toolCall.toolCallId] = {
                type: 'tool-approval-request',
                approvalId,
                toolCall,
                isAutomatic: true,
              };
              stepToolApprovalResponses[toolCall.toolCallId] = {
                type: 'tool-approval-response',
                approvalId,
                toolCall,
                approved: true,
                reason: toolApprovalStatus.reason,
                providerExecuted: toolCall.providerExecuted,
              };
              break;
            }

            case 'denied': {
              const approvalId = generateId();

              toolApprovalRequests[toolCall.toolCallId] = {
                type: 'tool-approval-request',
                approvalId,
                toolCall,
                isAutomatic: true,
              };
              stepToolApprovalResponses[toolCall.toolCallId] = {
                type: 'tool-approval-response',
                approvalId,
                toolCall,
                approved: false,
                reason: toolApprovalStatus.reason,
                providerExecuted: toolCall.providerExecuted,
              };
              blockedToolCallIds.add(toolCall.toolCallId);
              break;
            }
          }
        }

        // 插入无效工具调用的错误工具输出：
        // TODO AI SDK 6：无效输入不需要输出部分
        const invalidToolCalls = stepToolCalls.filter(
          toolCall => toolCall.invalid && toolCall.dynamic,
        );

        clientToolOutputs = [];

        for (const toolCall of invalidToolCalls) {
          clientToolOutputs.push({
            type: 'tool-error',
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            input: toolCall.input,
            error: getErrorMessage(toolCall.error!),
            dynamic: true,
          });
        }

        // 执行客户端工具调用：
        clientToolCalls = stepToolCalls.filter(
          toolCall => !toolCall.providerExecuted,
        );
        toolApprovalResponses = Object.values(stepToolApprovalResponses);
        deniedToolApprovalResponses = toolApprovalResponses.filter(
          toolApprovalResponse => toolApprovalResponse.approved === false,
        );
        const toolExecutionMs: Record<string, number> = {};

        if (tools != null) {
          const toolExecutionResults = await executeTools({
            toolCalls: clientToolCalls.filter(
              toolCall =>
                !toolCall.invalid &&
                !blockedToolCallIds.has(toolCall.toolCallId),
            ),
            tools,
            callId,
            messages: stepMessages,
            abortSignal: mergedAbortSignal,
            timeout,
            experimental_sandbox: stepSandbox,
            toolsContext,
            onToolExecutionStart: event =>
              notify({
                event,
                callbacks: [
                  resolvedOnToolExecutionStart,
                  telemetryDispatcher.onToolExecutionStart,
                ],
              }),
            onToolExecutionEnd: event =>
              notify({
                event,
                callbacks: [
                  resolvedOnToolExecutionEnd,
                  telemetryDispatcher.onToolExecutionEnd,
                ],
              }),
            executeToolInTelemetryContext: telemetryDispatcher.executeTool,
          });

          for (const result of toolExecutionResults) {
            toolExecutionMs[result.output.toolCallId] = result.toolExecutionMs;
            clientToolOutputs.push(result.output);
          }
        }

        const stepTimeMs = now() - stepStartTimestampMs;
        const stepPerformance: StepResultPerformance = {
          effectiveOutputTokensPerSecond: calculateTokensPerSecond({
            tokens: stepUsage.outputTokens,
            durationMs: responseTimeMs,
          }),
          outputTokensPerSecond: undefined,
          inputTokensPerSecond: undefined,
          effectiveTotalTokensPerSecond: calculateTokensPerSecond({
            tokens: sumTokenCounts(
              stepUsage.inputTokens,
              stepUsage.outputTokens,
            ),
            durationMs: responseTimeMs,
          }),
          stepTimeMs,
          responseTimeMs,
          toolExecutionMs,
          timeToFirstOutputTokenMs: undefined,
        };

        // 跟踪提供者执行的支持延迟结果的工具调用。
        // 在编程工具调用中，服务器工具（例如，code_execution）可以
        // 触发客户端工具，并且服务器工具的结果被推迟到
        // 客户端工具的结果被发回。
        for (const toolCall of stepToolCalls) {
          if (!toolCall.providerExecuted) continue;
          const tool = tools?.[toolCall.toolName];
          if (tool?.type === 'provider' && tool.supportsDeferredResults) {
            // 检查此工具调用在当前响应中是否已有结果
            const hasResultInResponse = currentModelResponse.content.some(
              part =>
                part.type === 'tool-result' &&
                part.toolCallId === toolCall.toolCallId,
            );
            if (!hasResultInResponse) {
              pendingDeferredToolCalls.set(toolCall.toolCallId, {
                toolName: toolCall.toolName,
              });
            }
          }
        }

        // 当我们收到结果时，将延迟的工具调用标记为已解决
        for (const part of currentModelResponse.content) {
          if (part.type === 'tool-result') {
            pendingDeferredToolCalls.delete(part.toolCallId);
          }
        }

        // 内容：
        const stepContent = asContent({
          content: currentModelResponse.content,
          toolCalls: stepToolCalls,
          toolOutputs: clientToolOutputs,
          toolApprovalRequests: Object.values(toolApprovalRequests),
          toolApprovalResponses,
          tools,
        });

        const stepResponseMessages = await toResponseMessages({
          content: stepContent,
          tools,
        });

        // 添加步骤信息（响应消息更新后）：
        // 根据包含设置有条件地包含request.body和response.body。
        // 大负载（例如，base64 编码的图像）可能会导致内存问题。
        const stepRequest: LanguageModelRequestMetadata = {
          ...currentModelResponse.request,
          body: include.requestBody
            ? currentModelResponse.request?.body
            : undefined,
          messages: include.requestMessages
            ? cloneModelMessages(stepMessages)
            : undefined,
        };

        const stepResponse = {
          ...currentModelResponse.response,
          // 深度克隆消息以避免在多步骤中改变步骤结果：
          messages: cloneModelMessages(stepResponseMessages),
          // 有条件地包含响应正文：
          body: include.responseBody
            ? currentModelResponse.response?.body
            : undefined,
        };

        const currentStepResult: StepResult<TOOLS, RUNTIME_CONTEXT> =
          new DefaultStepResult({
            callId,
            stepNumber,
            provider: stepModel.provider,
            modelId: stepModel.modelId,
            runtimeContext,
            content: stepContent,
            finishReason: currentModelResponse.finishReason.unified,
            rawFinishReason: currentModelResponse.finishReason.raw,
            usage: stepUsage,
            performance: stepPerformance,
            warnings: currentModelResponse.warnings,
            providerMetadata: currentModelResponse.providerMetadata,
            request: stepRequest,
            response: stepResponse,
            toolsContext,
          });

        logWarnings({
          warnings: currentModelResponse.warnings ?? [],
          provider: stepModel.provider,
          model: stepModel.modelId,
        });

        steps.push(currentStepResult);
        instructionsForNextStep = stepInstructions;
        messagesForNextStep = [...stepMessages, ...stepResponseMessages];

        await notify({
          event: currentStepResult,
          callbacks: [onStepFinish, telemetryDispatcher.onStepFinish],
        });
      } finally {
        if (stepTimeoutId != null) {
          clearTimeout(stepTimeoutId);
        }
      }
    } while (
      // 如果出现以下情况，请继续：
      // 1. 存在已全部执行或拒绝的客户端工具调用，或者
      // 2. 提供商执行的工具有待确定的延迟结果
      ((clientToolCalls.length > 0 &&
        clientToolOutputs.length + deniedToolApprovalResponses.length ===
          clientToolCalls.length) ||
        pendingDeferredToolCalls.size > 0) &&
      // 继续直到满足停止条件：
      !(await isStopConditionMet({ stopConditions, steps }))
    );

    const lastStep = steps[steps.length - 1];

    const totalUsage = steps.reduce(
      (totalUsage, step) => {
        return addLanguageModelUsage(totalUsage, step.usage);
      },
      {
        inputTokens: undefined,
        inputTokenDetails: {
          noCacheTokens: undefined,
          cacheReadTokens: undefined,
          cacheWriteTokens: undefined,
        },
        outputTokens: undefined,
        outputTokenDetails: {
          textTokens: undefined,
          reasoningTokens: undefined,
        },
        totalTokens: undefined,
      } as LanguageModelUsage,
    );

    const files = steps.flatMap(step => step.files);
    const warnings = steps.flatMap(step => step.warnings ?? []);

    const onFinishEvent = {
      callId,
      stepNumber: lastStep.stepNumber,
      model: lastStep.model,
      runtimeContext: lastStep.runtimeContext,
      finishReason: lastStep.finishReason,
      rawFinishReason: lastStep.rawFinishReason,
      usage: lastStep.usage,
      content: lastStep.content,
      text: lastStep.text,
      reasoningText: lastStep.reasoningText,
      reasoning: lastStep.reasoning,
      files,
      sources: lastStep.sources,
      toolCalls: lastStep.toolCalls,
      staticToolCalls: lastStep.staticToolCalls,
      dynamicToolCalls: lastStep.dynamicToolCalls,
      toolResults: lastStep.toolResults,
      staticToolResults: lastStep.staticToolResults,
      dynamicToolResults: lastStep.dynamicToolResults,
      request: lastStep.request,
      response: lastStep.response,
      responseMessages: [
        ...initialResponseMessages,
        ...steps.flatMap(step => step.response.messages),
      ],
      warnings,
      providerMetadata: lastStep.providerMetadata,
      steps,
      totalUsage,
      toolsContext,
    };

    await notify({
      event: onFinishEvent,
      callbacks: [onFinish, telemetryDispatcher.onEnd],
    });

    // 仅当最后一步以`stop`完成时才解析输出：
    let resolvedOutput;
    if (lastStep.finishReason === 'stop') {
      const outputSpecification = output ?? text();
      resolvedOutput = await outputSpecification.parseCompleteOutput(
        { text: lastStep.text },
        {
          response: lastStep.response,
          usage: lastStep.usage,
          finishReason: lastStep.finishReason,
        },
      );
    }

    return new DefaultGenerateTextResult({
      initialResponseMessages,
      steps,
      totalUsage,
      output: resolvedOutput,
    });
  } catch (error) {
    await telemetryDispatcher.onError?.({ callId, error });
    throw wrapGatewayError(error);
  }
}

async function executeTools<TOOLS extends ToolSet>({
  toolCalls,
  tools,
  callId,
  messages,
  abortSignal,
  timeout,
  experimental_sandbox: sandbox,
  toolsContext,
  onToolExecutionStart,
  onToolExecutionEnd,
  executeToolInTelemetryContext,
}: {
  toolCalls: Array<TypedToolCall<TOOLS>>;
  tools: TOOLS;
  callId: string;
  messages: ModelMessage[];
  abortSignal: AbortSignal | undefined;
  timeout?: TimeoutConfiguration<TOOLS>;
  experimental_sandbox?: Sandbox;
  toolsContext: InferToolSetContext<TOOLS>;
  onToolExecutionStart?: OnToolExecutionStartCallback<TOOLS>;
  onToolExecutionEnd?: OnToolExecutionEndCallback<TOOLS>;
  executeToolInTelemetryContext?: Telemetry['executeTool'];
}): Promise<
  Array<{
    output: ToolOutput<TOOLS>;
    toolExecutionMs: number;
  }>
> {
  const toolResults = await Promise.all(
    toolCalls.map(
      async toolCall =>
        await executeToolCall({
          toolCall,
          tools,
          callId,
          messages,
          abortSignal,
          timeout,
          experimental_sandbox: sandbox,
          toolsContext,
          onToolExecutionStart,
          onToolExecutionEnd,
          executeToolInTelemetryContext,
        }),
    ),
  );

  return toolResults.filter(
    (result): result is NonNullable<typeof result> => result != null,
  );
}

class DefaultGenerateTextResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
  OUTPUT extends Output,
> implements GenerateTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT> {
  readonly steps: GenerateTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>['steps'];
  readonly totalUsage: LanguageModelUsage;
  private readonly _output: InferCompleteOutput<OUTPUT> | undefined;

  constructor(options: {
    initialResponseMessages: Array<ResponseMessage>;
    steps: GenerateTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>['steps'];
    output: InferCompleteOutput<OUTPUT> | undefined;
    totalUsage: LanguageModelUsage;
  }) {
    this.initialResponseMessages = options.initialResponseMessages;
    this.steps = options.steps;
    this._output = options.output;
    this.totalUsage = options.totalUsage;
  }

  private readonly initialResponseMessages: Array<ResponseMessage>;

  get finalStep() {
    return this.steps.at(-1)!;
  }

  get content() {
    return this.steps.flatMap(step => step.content);
  }

  get text() {
    return this.finalStep.text;
  }

  get files() {
    return this.steps.flatMap(step => step.files);
  }

  get reasoningText() {
    return this.finalStep.reasoningText;
  }

  get reasoning() {
    return convertToReasoningOutputs(this.finalStep.reasoning);
  }

  get toolCalls() {
    return this.steps.flatMap(step => step.toolCalls);
  }

  get staticToolCalls() {
    return this.steps.flatMap(step => step.staticToolCalls);
  }

  get dynamicToolCalls() {
    return this.steps.flatMap(step => step.dynamicToolCalls);
  }

  get toolResults() {
    return this.steps.flatMap(step => step.toolResults);
  }

  get staticToolResults() {
    return this.steps.flatMap(step => step.staticToolResults);
  }

  get dynamicToolResults() {
    return this.steps.flatMap(step => step.dynamicToolResults);
  }

  get sources() {
    return this.steps.flatMap(step => step.sources);
  }

  get finishReason() {
    return this.finalStep.finishReason;
  }

  get rawFinishReason() {
    return this.finalStep.rawFinishReason;
  }

  get warnings() {
    return this.steps.flatMap(step => step.warnings ?? []);
  }

  get providerMetadata() {
    return this.finalStep.providerMetadata;
  }

  get response() {
    return this.finalStep.response;
  }

  get responseMessages() {
    return [
      ...this.initialResponseMessages,
      ...this.steps.flatMap(step => step.response.messages),
    ];
  }

  get request() {
    return this.finalStep.request;
  }

  get usage() {
    return this.totalUsage;
  }

  get output() {
    if (this._output == null) {
      throw new NoOutputGeneratedError();
    }

    return this._output;
  }
}

function asContent<TOOLS extends ToolSet>({
  content,
  toolCalls,
  toolOutputs,
  toolApprovalRequests,
  toolApprovalResponses,
  tools,
}: {
  content: Array<LanguageModelV4Content>;
  toolCalls: Array<TypedToolCall<TOOLS>>;
  toolOutputs: Array<ToolOutput<TOOLS>>;
  toolApprovalRequests: Array<ToolApprovalRequestOutput<TOOLS>>;
  toolApprovalResponses: Array<ToolApprovalResponseOutput<TOOLS>>;
  tools: TOOLS | undefined;
}): Array<ContentPart<TOOLS>> {
  const contentParts: Array<ContentPart<TOOLS>> = [];
  const toolOutputsWithApprovalResponses: Array<ToolOutput<TOOLS>> = [];
  const toolOutputsWithoutApprovalResponses: Array<ToolOutput<TOOLS>> = [];
  const toolCallIdsWithApprovalResponses = new Set(
    toolApprovalResponses.map(
      toolApprovalResponse => toolApprovalResponse.toolCall.toolCallId,
    ),
  );

  for (const part of content) {
    switch (part.type) {
      case 'text':
      case 'reasoning':
      case 'custom':
      case 'source':
        contentParts.push(part);
        break;

      case 'file':
      case 'reasoning-file': {
        contentParts.push({
          type: part.type as 'file' | 'reasoning-file',
          file: new DefaultGeneratedFile({
            data:
              part.data.type === 'data'
                ? part.data.data
                : part.data.url.toString(),
            mediaType: part.mediaType,
          }),
          ...(part.providerMetadata != null
            ? { providerMetadata: part.providerMetadata }
            : {}),
        });
        break;
      }

      case 'tool-call': {
        contentParts.push(
          toolCalls.find(toolCall => toolCall.toolCallId === part.toolCallId)!,
        );
        break;
      }

      case 'tool-result': {
        const toolCall = toolCalls.find(
          toolCall => toolCall.toolCallId === part.toolCallId,
        );

        // 处理提供者执行的工具的延迟结果（例如，编程工具调用）。
        // 当服务器工具（如code_execution）触发客户端工具时，服务器工具的
        // 结果可能会推迟到稍后的回合。在这种情况下，没有匹配的工具调用
        // 在当前的响应中。
        if (toolCall == null) {
          const tool = tools?.[part.toolName];
          const supportsDeferredResults =
            tool?.type === 'provider' && tool.supportsDeferredResults;

          if (!supportsDeferredResults) {
            throw new Error(`Tool call ${part.toolCallId} not found.`);
          }

          // 在没有工具调用输入的情况下创建工具结果（延迟结果）
          if (part.isError) {
            contentParts.push({
              type: 'tool-error' as const,
              toolCallId: part.toolCallId,
              toolName: part.toolName as keyof TOOLS & string,
              input: undefined,
              error: part.result,
              providerExecuted: true,
              dynamic: part.dynamic,
              ...(part.providerMetadata != null
                ? { providerMetadata: part.providerMetadata }
                : {}),
              ...(tool?.metadata != null
                ? { toolMetadata: tool.metadata }
                : {}),
            } as TypedToolError<TOOLS>);
          } else {
            contentParts.push({
              type: 'tool-result' as const,
              toolCallId: part.toolCallId,
              toolName: part.toolName as keyof TOOLS & string,
              input: undefined,
              output: part.result,
              providerExecuted: true,
              dynamic: part.dynamic,
              ...(part.providerMetadata != null
                ? { providerMetadata: part.providerMetadata }
                : {}),
              ...(tool?.metadata != null
                ? { toolMetadata: tool.metadata }
                : {}),
            } as TypedToolResult<TOOLS>);
          }
          break;
        }

        if (part.isError) {
          contentParts.push({
            type: 'tool-error' as const,
            toolCallId: part.toolCallId,
            toolName: part.toolName as keyof TOOLS & string,
            input: toolCall.input,
            error: part.result,
            providerExecuted: true,
            dynamic: toolCall.dynamic,
            ...(part.providerMetadata != null
              ? { providerMetadata: part.providerMetadata }
              : {}),
            ...(toolCall.toolMetadata != null
              ? { toolMetadata: toolCall.toolMetadata }
              : {}),
          } as TypedToolError<TOOLS>);
        } else {
          contentParts.push({
            type: 'tool-result' as const,
            toolCallId: part.toolCallId,
            toolName: part.toolName as keyof TOOLS & string,
            input: toolCall.input,
            output: part.result,
            providerExecuted: true,
            dynamic: toolCall.dynamic,
            ...(part.providerMetadata != null
              ? { providerMetadata: part.providerMetadata }
              : {}),
            ...(toolCall.toolMetadata != null
              ? { toolMetadata: toolCall.toolMetadata }
              : {}),
          } as TypedToolResult<TOOLS>);
        }
        break;
      }

      case 'tool-approval-request': {
        const toolCall = toolCalls.find(
          toolCall => toolCall.toolCallId === part.toolCallId,
        );

        if (toolCall == null) {
          throw new ToolCallNotFoundForApprovalError({
            toolCallId: part.toolCallId,
            approvalId: part.approvalId,
          });
        }

        contentParts.push({
          type: 'tool-approval-request' as const,
          approvalId: part.approvalId,
          toolCall,
        });
        break;
      }
    }
  }

  for (const toolOutput of toolOutputs) {
    if (toolCallIdsWithApprovalResponses.has(toolOutput.toolCallId)) {
      toolOutputsWithApprovalResponses.push(toolOutput);
    } else {
      toolOutputsWithoutApprovalResponses.push(toolOutput);
    }
  }

  return [
    ...contentParts,
    ...toolOutputsWithoutApprovalResponses,
    ...toolApprovalRequests,
    ...toolApprovalResponses,
    ...toolOutputsWithApprovalResponses,
  ];
}
