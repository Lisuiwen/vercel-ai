import {
  getErrorMessage,
  UnsupportedFunctionalityError,
  type LanguageModelV4,
  type SharedV4Warning,
} from '@ai-sdk/provider';
import {
  asArray,
  createIdGenerator,
  DelayedPromise,
  filterNullable,
  isAbortError,
  type Arrayable,
  type Context,
  type Experimental_Sandbox as Sandbox,
  type IdGenerator,
  type InferToolSetContext,
  type ModelMessage,
  type ProviderOptions,
  type ToolApprovalResponse,
  type ToolContent,
  type ToolSet,
} from '@ai-sdk/provider-utils';
import type { ServerResponse } from 'node:http';
import { NoOutputGeneratedError } from '../error';
import { logWarnings } from '../logger/log-warnings';
import { resolveLanguageModel } from '../model/resolve-model';
import { cloneModelMessages } from '../prompt/clone-model-message';
import { createToolModelOutput } from '../prompt/create-tool-model-output';
import type { LanguageModelCallOptions } from '../prompt/language-model-call-options';
import { prepareLanguageModelCallOptions } from '../prompt/prepare-language-model-call-options';
import { prepareToolChoice } from '../prompt/prepare-tool-choice';
import { prepareTools } from '../prompt/prepare-tools';
import type { Prompt } from '../prompt/prompt';
import {
  getChunkTimeoutMs,
  getStepTimeoutMs,
  getTotalTimeoutMs,
  type RequestOptions,
  type TimeoutConfiguration,
} from '../prompt/request-options';
import { standardizePrompt } from '../prompt/standardize-prompt';
import { wrapGatewayError } from '../prompt/wrap-gateway-error';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import { createTextStreamResponse } from '../text-stream/create-text-stream-response';
import { pipeTextStreamToResponse } from '../text-stream/pipe-text-stream-to-response';
import type { LanguageModelRequestMetadata } from '../types';
import type {
  CallWarning,
  FinishReason,
  LanguageModel,
  ToolChoice,
} from '../types/language-model';
import type { ProviderMetadata } from '../types/provider-metadata';
import {
  addLanguageModelUsage,
  createNullLanguageModelUsage,
  type LanguageModelUsage,
} from '../types/usage';
import type { UIMessage } from '../ui';
import { createUIMessageStreamResponse } from '../ui-message-stream/create-ui-message-stream-response';
import { getResponseUIMessageId } from '../ui-message-stream/get-response-ui-message-id';
import { handleUIMessageStreamFinish } from '../ui-message-stream/handle-ui-message-stream-finish';
import { pipeUIMessageStreamToResponse } from '../ui-message-stream/pipe-ui-message-stream-to-response';
import type {
  InferUIMessageChunk,
  UIMessageChunk,
} from '../ui-message-stream/ui-message-chunks';
import type { UIMessageStreamResponseInit } from '../ui-message-stream/ui-message-stream-response-init';
import type {
  InferUIMessageData,
  InferUIMessageMetadata,
} from '../ui/ui-messages';
import {
  createAsyncIterableStream,
  type AsyncIterableStream,
} from '../util/async-iterable-stream';
import type { Callback } from '../util/callback';
import { consumeStream } from '../util/consume-stream';
import { createStitchableStream } from '../util/create-stitchable-stream';
import type { DownloadFunction } from '../util/download/download-function';
import { mergeAbortSignals } from '../util/merge-abort-signals';
import { mergeObjects } from '../util/merge-objects';
import { notify } from '../util/notify';
import { now as originalNow } from '../util/now';
import { prepareRetries } from '../util/prepare-retries';
import { setAbortTimeout } from '../util/set-abort-timeout';
import type { ActiveTools } from './active-tools';
import { collectToolApprovals } from './collect-tool-approvals';
import type { ContentPart } from './content-part';
import {
  executeToolsFromStream,
  type ExecuteToolsStreamPart,
} from './execute-tools-from-stream';
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
import { invokeToolCallbacksFromStream } from './invoke-tool-callbacks-from-stream';
import type {
  OnLanguageModelCallEndCallback,
  OnLanguageModelCallStartCallback,
} from './language-model-events';
import { text, type Output } from './output';
import type {
  InferCompleteOutput,
  InferElementOutput,
  InferPartialOutput,
} from './output-utils';
import type { PrepareStepFunction } from './prepare-step';
import { convertToReasoningOutputs } from './reasoning-output';
import type { ResponseMessage } from './response-message';
import { createRestrictedTelemetryDispatcher } from './restricted-telemetry-dispatcher';
import { DefaultStepResult, type StepResult } from './step-result';
import {
  isStepCount,
  isStopConditionMet,
  type StopCondition,
} from './stop-condition';
import { streamLanguageModelCall } from './stream-language-model-call';
import type {
  ConsumeStreamOptions,
  StreamTextResult,
  TextStreamPart,
  UIMessageStreamOptions,
} from './stream-text-result';
import { toResponseMessages } from './to-response-messages';
import type { ToolApprovalConfiguration } from './tool-approval-configuration';
import type { TypedToolCall } from './tool-call';
import type { ToolCallRepairFunction } from './tool-call-repair-function';
import type {
  OnToolExecutionEndCallback,
  OnToolExecutionStartCallback,
} from './tool-execution-events';
import type { ToolInputRefinement } from './tool-input-refinement';
import type { ToolOutput } from './tool-output';
import type { StaticToolOutputDenied } from './tool-output-denied';
import type { ToolsContextParameter } from './tools-context-parameter';

const originalGenerateId = createIdGenerator({
  prefix: 'aitxt',
  size: 24,
});

const originalGenerateCallId = createIdGenerator({
  prefix: 'call',
  size: 24,
});

export type StreamTextInclude = {
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
   * 是否在流中包含来自提供者的原始块。
   *
   * 启用后，您将收到类型为“raw”的原始块，其中包含
   * 来自提供商的未处理的数据。
   *
   * 这允许访问尚未包含的尖端提供商功能
   * 人工智能 SDK。
   *
   * @default false
   */
  rawChunks?: boolean;
};

/**
 * 应用于流的转换。
 *
 * @param stopStream - A function that stops the source stream.
 * @param tools - The tools that are accessible to and can be called by the model. The model needs to support calling tools.
 */
export type StreamTextTransform<TOOLS extends ToolSet> = (options: {
  tools: TOOLS; // 用于类型推断
  stopStream: () => void;
}) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>;

/**
 * 使用“onError”选项设置的回调。
 *
 * @param event - The event that is passed to the callback.
 */
export type StreamTextOnErrorCallback = Callback<{
  error: unknown;
}>;

/**
 * 使用“onChunk”选项设置的回调。
 *
 * @param event - The event that is passed to the callback.
 */
export type StreamTextOnChunkCallback<TOOLS extends ToolSet> = (event: {
  chunk: Extract<
    TextStreamPart<TOOLS>,
    {
      type:
        | 'text-delta'
        | 'reasoning-delta'
        | 'custom'
        | 'source'
        | 'tool-call'
        | 'tool-input-start'
        | 'tool-input-delta'
        | 'tool-result'
        | 'raw';
    }
  >;
}) => PromiseLike<void> | void;

/**
 * 使用“onAbort”选项设置的回调。
 *
 * @param event - The event that is passed to the callback.
 */
export type StreamTextOnAbortCallback<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
> = Callback<{
  /**
   * 所有先前完成的步骤的详细信息。
   */
  readonly steps: StepResult<TOOLS, RUNTIME_CONTEXT>[];
}>;

/**
 * 使用语言模型为给定提示生成文本并调用工具。
 *
 * 该函数输出流。如果您不想流式传输输出，请改用“generateText”。
 *
 * @param model - The language model to use.
 * @param tools - Tools that are accessible to and can be called by the model. The model needs to support calling tools.
 *
 * @param system - A system message that will be part of the prompt.
 * @param prompt - A simple text prompt. You can either use `prompt` or `messages` but not both.
 * @param messages - A list of messages. You can either use `prompt` or `messages` but not both.
 * @param allowSystemInMessages - Whether system messages are allowed in the `prompt` or `messages` fields. Default: false.
 *
 * @param maxOutputTokens - Maximum number of tokens to generate.
 * @param temperature - Temperature setting.
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置“温度”或“topP”，但不能同时设置两者。
 * @param topP - Nucleus sampling.
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置“温度”或“topP”，但不能同时设置两者。
 * @param topK - Only sample from the top K options for each subsequent token.
 * 用于删除“长尾”低概率响应。
 * 仅推荐用于高级用例。通常您只需要使用温度。
 * @param presencePenalty - Presence penalty setting.
 * 它会影响模型重复提示中已有信息的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param frequencyPenalty - Frequency penalty setting.
 * 它影响模型重复使用相同单词或短语的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param stopSequences - Stop sequences.
 * 如果设置，模型将在生成停止序列之一时停止生成文本。
 * @param seed - The seed (integer) to use for random sampling.
 * 如果模型设置并支持，调用将生成确定性结果。
 *
 * @param maxRetries - Maximum number of retries. Set to 0 to disable retries. Default: 2.
 * @param abortSignal - An optional abort signal that can be used to cancel the call.
 * @param timeout - An optional timeout in milliseconds. The call will be aborted if it takes longer than the specified timeout.
 * @param headers - Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
 *
 * @param experimental_sandbox - The sandbox environment that is passed through to tool execution.
 * @param runtimeContext - User-defined runtime context that flows through the entire generation lifecycle.
 * @param experimental_refineToolInput - Optional mapping of tool names to functions that refine parsed tool inputs before tools are executed and before outputs, callbacks, and telemetry are recorded.
 *
 * @param onChunk - Callback that is called for each chunk of the stream. The stream processing will pause until the callback promise is resolved.
 * @param onError - Callback that is called when an error occurs during streaming. You can use it to log errors.
 * @param onToolExecutionStart - Callback invoked before each tool execution begins.
 * @param experimental_onToolCallStart - Deprecated alias for `onToolExecutionStart`.
 * @param onToolExecutionEnd - Callback invoked after each tool execution completes.
 * @param experimental_onToolCallFinish - Deprecated alias for `onToolExecutionEnd`.
 * @param onStepFinish - Callback that is called when each step (LLM call) is finished, including intermediate steps.
 * @param onFinish - Callback that is called when all steps are finished and the response is complete.
 *
 * @returns
 * 用于访问不同流类型和附加信息的结果对象。
 */
export function streamText<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = Output<string, string, never>,
>({
  model,
  tools,
  toolChoice,
  instructions,
  system,
  prompt,
  messages,
  allowSystemInMessages,
  maxRetries,
  abortSignal,
  timeout,
  headers,
  stopWhen = isStepCount(1),
  experimental_sandbox: sandbox,
  output,
  toolApproval,
  experimental_telemetry,
  telemetry = experimental_telemetry,
  prepareStep,
  providerOptions,
  activeTools,
  experimental_repairToolCall: repairToolCall,
  experimental_refineToolInput: refineToolInput,
  experimental_transform: transform,
  experimental_download: download,
  includeRawChunks,
  onChunk,
  onError = ({ error }) => {
    console.error(error);
  },
  onFinish,
  onAbort,
  onStepFinish,
  experimental_onStart: onStart,
  experimental_onStepStart: onStepStart,
  experimental_onLanguageModelCallStart: onLanguageModelCallStart,
  experimental_onLanguageModelCallEnd: onLanguageModelCallEnd,
  onToolExecutionStart,
  onToolExecutionEnd,
  experimental_onToolCallStart,
  experimental_onToolCallFinish,
  runtimeContext = {} as RUNTIME_CONTEXT,
  toolsContext = {} as InferToolSetContext<TOOLS>,
  experimental_include,
  include = experimental_include,
  _internal: {
    now = originalNow,
    generateId = originalGenerateId,
    generateCallId = originalGenerateCallId,
  } = {},
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
    toolChoice?: ToolChoice<TOOLS>;

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
     * @deprecated 请改用“遥测”。该别名将在未来的主要版本中删除。
     */
    experimental_telemetry?: TelemetryOptions<RUNTIME_CONTEXT, NoInfer<TOOLS>>;

    /**
     * 其他特定于提供商的选项。他们通过
     * 从 AI SDK 发送给提供商并启用特定于提供商的
     * 可以完全封装在提供者中的功能。
     */
    providerOptions?: ProviderOptions;

    /**
     * 传递到工具执行的沙箱环境。
     */
    experimental_sandbox?: Sandbox;

    /**
     * 运行时上下文。将运行时上下文视为不可变。
     * 如果您需要改变运行时上下文，请在“prepareStep”中更新它。
     */
    runtimeContext?: RUNTIME_CONTEXT;

    /**
     * 限制模型可以调用的工具，无需
     * 更改结果中的工具调用和结果类型。
     */
    activeTools?: ActiveTools<NoInfer<TOOLS>>;

    /**
     * 用于解析 LLM 响应的结构化输出的可选规范。
     */
    output?: OUTPUT;

    /**
     * 可选工具审批配置。
     *
     * 此配置优先于工具定义的批准设置。
     */
    toolApproval?: ToolApprovalConfiguration<TOOLS, RUNTIME_CONTEXT>;

    /**
     * 您可以使用可选函数为步骤提供不同的设置。
     *
     * @param options - The options for the step.
     * @param options.steps - The steps that have been executed so far.
     * @param options.stepNumber - The number of the step that is being executed.
     * @param options.model - The model that is being used.
     *
     * @returns An object that contains the settings for the step.
     * 如果返回未定义（或未定义的设置），则将使用外层的设置。
     */
    prepareStep?: PrepareStepFunction<NoInfer<TOOLS>, RUNTIME_CONTEXT>;

    /**
     * 尝试修复无法解析的工具调用的函数。
     */
    experimental_repairToolCall?: ToolCallRepairFunction<TOOLS>;

    /**
     * 工具名称到优化已解析工具输入的函数的可选映射。
     *
     * 精炼输入必须与工具输入具有相同的类型形状。精致
     * 输入用于工具执行、流部分、回调和遥测。
     */
    experimental_refineToolInput?: ToolInputRefinement<NoInfer<TOOLS>>;

    /**
     * 可选的流转换。
     * 它们按照提供的顺序应用。
     * 流转换必须维护流结构，streamText 才能正常工作。
     */
    experimental_transform?: Arrayable<StreamTextTransform<TOOLS>>;

    /**
     * 用于 URL 的自定义下载功能。
     *
     * 默认情况下，如果模型不支持给定媒体类型的 URL，则会下载文件。
     */
    experimental_download?: DownloadFunction | undefined;

    /**
     * 是否在流中包含来自提供者的原始块。
     * 启用后，您将收到类型为“raw”的原始块，其中包含来自提供商的未处理的数据。
     * 这允许访问 AI SDK 尚未包含的尖端提供商功能。
     * 默认为 false。
     *
     * @deprecated 请改用“include.rawChunks”。
     */
    includeRawChunks?: boolean;

    /**
     * 为流的每个块调用的回调。
     * 流处理将暂停，直到回调承诺得到解决。
     */
    onChunk?: StreamTextOnChunkCallback<TOOLS>;

    /**
     * 流式传输过程中发生错误时调用的回调。
     * 您可以使用它来记录错误。
     * 流处理将暂停，直到回调承诺得到解决。
     */
    onError?: StreamTextOnErrorCallback;

    /**
     * 当LLM响应和所有请求工具执行时调用的回调
     * （对于具有“执行”功能的工具）已完成。
     *
     * 使用量是所有步骤的组合使用量。
     */
    onFinish?: GenerateTextOnFinishCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>
    >;

    onAbort?: StreamTextOnAbortCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>
    >;

    /**
     * 每个步骤（LLM 调用）完成时调用的回调，包括中间步骤。
     */
    onStepFinish?: GenerateTextOnStepFinishCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>
    >;

    /**
     * 当streamText操作开始时调用的回调，
     * 在拨打任何 LLM 电话之前。
     */
    experimental_onStart?: GenerateTextOnStartCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>,
      NoInfer<OUTPUT>
    >;

    /**
     * 步骤（LLM 调用）开始时调用的回调，
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
     * @deprecated 请改用“onToolExecutionStart”。
     */
    experimental_onToolCallStart?: OnToolExecutionStartCallback<NoInfer<TOOLS>>;

    /**
     * 在工具的执行函数完成（或出错）后立即调用的回调。
     */
    onToolExecutionEnd?: OnToolExecutionEndCallback<NoInfer<TOOLS>>;

    /**
     * 在工具的执行函数完成（或出错）后立即调用的回调。
     *
     * @deprecated 请改用“onToolExecutionEnd”。
     */
    experimental_onToolCallFinish?: OnToolExecutionEndCallback<NoInfer<TOOLS>>;

    /**
     * 用于控制步骤结果中包含哪些数据的设置。
     * 禁用包含可以帮助减少处理时的内存使用量
     * 图像等大型有效负载。
     *
     * 默认情况下，不包括请求正文和请求消息。
     */
    include?: StreamTextInclude;

    /**
     * 用于控制步骤结果中包含哪些数据的设置。
     *
     * @deprecated 请改用“include”。
     */
    experimental_include?: StreamTextInclude;

    /**
     * 内部的。仅供测试使用。可能会更改，恕不另行通知。
     */
    _internal?: {
      now?: () => number;
      generateId?: IdGenerator;
      generateCallId?: IdGenerator;
    };
  }): StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT> {
  const totalTimeoutMs = getTotalTimeoutMs(timeout);
  const stepTimeoutMs = getStepTimeoutMs(timeout);
  const chunkTimeoutMs = getChunkTimeoutMs(timeout);
  const stepAbortController =
    stepTimeoutMs != null ? new AbortController() : undefined;
  const chunkAbortController =
    chunkTimeoutMs != null ? new AbortController() : undefined;
  const resolvedOnToolExecutionStart =
    onToolExecutionStart ?? experimental_onToolCallStart;
  const resolvedOnToolExecutionEnd =
    onToolExecutionEnd ?? experimental_onToolCallFinish;
  return new DefaultStreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>({
    model: resolveLanguageModel(model),
    telemetry,
    headers,
    settings,
    maxRetries,
    abortSignal: mergeAbortSignals(
      abortSignal,
      totalTimeoutMs,
      stepAbortController?.signal,
      chunkAbortController?.signal,
    ),
    stepTimeoutMs,
    stepAbortController,
    chunkTimeoutMs,
    chunkAbortController,
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
    experimental_sandbox: sandbox,
    tools,
    toolsContext,
    runtimeContext,
    toolChoice,
    transforms: asArray(transform),
    activeTools,
    repairToolCall,
    refineToolInput,
    stopConditions: asArray(stopWhen),
    output,
    toolApproval,
    providerOptions,
    prepareStep,
    timeout,
    onChunk,
    onError,
    onFinish,
    onAbort,
    onStepFinish,
    onStart,
    onStepStart,
    onLanguageModelCallStart,
    onLanguageModelCallEnd,
    onToolExecutionStart: resolvedOnToolExecutionStart,
    onToolExecutionEnd: resolvedOnToolExecutionEnd,
    now,
    generateId,
    generateCallId,
    download,

    // 分配默认值以包括：
    include: {
      requestBody: include?.requestBody ?? false,
      requestMessages: include?.requestMessages ?? false,
      rawChunks: include?.rawChunks ?? includeRawChunks ?? false,
    },
  });
}

export type EnrichedStreamPart<TOOLS extends ToolSet, PARTIAL_OUTPUT> = {
  part: TextStreamPart<TOOLS>;
  partialOutput: PARTIAL_OUTPUT | undefined;
};

function createOutputTransformStream<
  TOOLS extends ToolSet,
  OUTPUT extends Output,
>(
  output: OUTPUT,
): TransformStream<
  TextStreamPart<TOOLS>,
  EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>
> {
  let firstTextChunkId: string | undefined = undefined;
  let text = '';
  let textChunk = '';
  let textProviderMetadata: ProviderMetadata | undefined = undefined;
  let lastPublishedValue = '';

  function publishTextChunk({
    controller,
    partialOutput = undefined,
  }: {
    controller: TransformStreamDefaultController<
      EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>
    >;
    partialOutput?: InferPartialOutput<OUTPUT>;
  }) {
    controller.enqueue({
      part: {
        type: 'text-delta',
        id: firstTextChunkId!,
        text: textChunk,
        providerMetadata: textProviderMetadata,
      },
      partialOutput,
    });
    textChunk = '';
  }

  return new TransformStream<
    TextStreamPart<TOOLS>,
    EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>
  >({
    async transform(chunk, controller) {
      // 确保我们在步骤完成之前发布最后一个文本块：
      if (chunk.type === 'finish-step' && textChunk.length > 0) {
        publishTextChunk({ controller });
      }

      if (
        chunk.type !== 'text-delta' &&
        chunk.type !== 'text-start' &&
        chunk.type !== 'text-end'
      ) {
        controller.enqueue({ part: chunk, partialOutput: undefined });
        return;
      }

      // 我们必须选择一个包含 json 文本的文本块
      // 由于我们正在流式传输，因此我们必须选择第一个文本块
      if (firstTextChunkId == null) {
        firstTextChunkId = chunk.id;
      } else if (chunk.id !== firstTextChunkId) {
        controller.enqueue({ part: chunk, partialOutput: undefined });
        return;
      }

      if (chunk.type === 'text-start') {
        controller.enqueue({ part: chunk, partialOutput: undefined });
        return;
      }

      if (chunk.type === 'text-end') {
        if (textChunk.length > 0) {
          publishTextChunk({ controller });
        }
        controller.enqueue({ part: chunk, partialOutput: undefined });
        return;
      }

      text += chunk.text;
      textChunk += chunk.text;
      textProviderMetadata = chunk.providerMetadata ?? textProviderMetadata;

      // 仅在可以解析部分 json 的情况下发布：
      const result = await output.parsePartialOutput({ text });

      // 应该允许 null（有效的 JSON 值），但不应该允许 undefined：
      if (result !== undefined) {
        // 仅在更改时发送新值：
        // 对于字符串部分（文本输出），直接比较以避免不必要的 JSON.stringify 开销
        const currentValue =
          typeof result.partial === 'string'
            ? result.partial
            : JSON.stringify(result.partial);
        if (currentValue !== lastPublishedValue) {
          publishTextChunk({ controller, partialOutput: result.partial });
          lastPublishedValue = currentValue;
        }
      }
    },
  });
}

class DefaultStreamTextResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
  OUTPUT extends Output,
> implements StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT> {
  private readonly _totalUsage = new DelayedPromise<
    Awaited<StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>['usage']>
  >();
  private readonly _finishReason = new DelayedPromise<
    Awaited<StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>['finishReason']>
  >();
  private readonly _rawFinishReason = new DelayedPromise<
    Awaited<StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>['rawFinishReason']>
  >();
  private readonly _steps = new DelayedPromise<
    Awaited<StreamTextResult<TOOLS, RUNTIME_CONTEXT, OUTPUT>['steps']>
  >();
  private readonly _initialResponseMessages = new DelayedPromise<
    Array<ResponseMessage>
  >();

  private readonly addStream: (
    stream: ReadableStream<TextStreamPart<TOOLS>>,
  ) => void;

  private readonly closeStream: () => void;

  private baseStream: ReadableStream<
    EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>
  >;

  private outputSpecification: OUTPUT | undefined;

  private tools: TOOLS | undefined;

  constructor({
    model,
    telemetry,
    headers,
    settings,
    maxRetries: maxRetriesArg,
    abortSignal,
    stepTimeoutMs,
    stepAbortController,
    chunkTimeoutMs,
    chunkAbortController,
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
    experimental_sandbox: sandbox,
    tools,
    toolChoice,
    transforms,
    activeTools,
    repairToolCall,
    refineToolInput,
    stopConditions,
    output,
    toolApproval,
    providerOptions,
    prepareStep,
    now,
    generateId,
    generateCallId,
    timeout,
    onChunk,
    onError,
    onFinish,
    onAbort,
    onStepFinish,
    onStart,
    onStepStart,
    onLanguageModelCallStart,
    onLanguageModelCallEnd,
    onToolExecutionStart,
    onToolExecutionEnd,
    runtimeContext,
    toolsContext,
    download,
    include,
  }: {
    model: LanguageModelV4;
    telemetry: TelemetryOptions<RUNTIME_CONTEXT, TOOLS> | undefined;
    headers: Record<string, string | undefined> | undefined;
    settings: LanguageModelCallOptions;
    maxRetries: number | undefined;
    abortSignal: AbortSignal | undefined;
    stepTimeoutMs: number | undefined;
    stepAbortController: AbortController | undefined;
    chunkTimeoutMs: number | undefined;
    chunkAbortController: AbortController | undefined;
    toolsContext: InferToolSetContext<TOOLS>;
    runtimeContext: RUNTIME_CONTEXT;
    instructions: Prompt['instructions'];
    system: Prompt['system'];
    prompt: Prompt['prompt'];
    messages: Prompt['messages'];
    allowSystemInMessages: Prompt['allowSystemInMessages'];
    experimental_sandbox: Sandbox | undefined;
    tools: TOOLS | undefined;
    toolChoice: ToolChoice<TOOLS> | undefined;
    transforms: Array<StreamTextTransform<TOOLS>>;
    activeTools: ActiveTools<TOOLS>;
    repairToolCall: ToolCallRepairFunction<TOOLS> | undefined;
    refineToolInput: ToolInputRefinement<TOOLS> | undefined;
    stopConditions: Array<
      StopCondition<NoInfer<TOOLS>, NoInfer<RUNTIME_CONTEXT>>
    >;
    output: OUTPUT | undefined;
    toolApproval: ToolApprovalConfiguration<TOOLS, RUNTIME_CONTEXT> | undefined;
    providerOptions: ProviderOptions | undefined;
    prepareStep:
      | PrepareStepFunction<NoInfer<TOOLS>, NoInfer<RUNTIME_CONTEXT>>
      | undefined;
    now: () => number;
    generateId: () => string;
    generateCallId: () => string;
    timeout: TimeoutConfiguration<TOOLS> | undefined;
    download: DownloadFunction | undefined;
    include: Required<StreamTextInclude>;

    // 回调：
    onChunk: undefined | StreamTextOnChunkCallback<TOOLS>;
    onError: StreamTextOnErrorCallback;
    onFinish:
      | undefined
      | GenerateTextOnFinishCallback<NoInfer<TOOLS>, NoInfer<RUNTIME_CONTEXT>>;
    onAbort:
      | undefined
      | StreamTextOnAbortCallback<NoInfer<TOOLS>, NoInfer<RUNTIME_CONTEXT>>;
    onStepFinish:
      | undefined
      | GenerateTextOnStepFinishCallback<
          NoInfer<TOOLS>,
          NoInfer<RUNTIME_CONTEXT>
        >;
    onStart:
      | undefined
      | GenerateTextOnStartCallback<
          NoInfer<TOOLS>,
          NoInfer<RUNTIME_CONTEXT>,
          NoInfer<OUTPUT>
        >;
    onStepStart:
      | undefined
      | GenerateTextOnStepStartCallback<
          NoInfer<TOOLS>,
          NoInfer<RUNTIME_CONTEXT>,
          NoInfer<OUTPUT>
        >;
    onLanguageModelCallStart: undefined | OnLanguageModelCallStartCallback;
    onLanguageModelCallEnd:
      | undefined
      | OnLanguageModelCallEndCallback<NoInfer<TOOLS>>;
    onToolExecutionStart: undefined | OnToolExecutionStartCallback<TOOLS>;
    onToolExecutionEnd: undefined | OnToolExecutionEndCallback<TOOLS>;
  }) {
    this.outputSpecification = output;
    this.tools = tools;

    const telemetryDispatcher = createRestrictedTelemetryDispatcher<
      TOOLS,
      RUNTIME_CONTEXT,
      OUTPUT
    >({
      telemetry,
      includeRuntimeContext: telemetry?.includeRuntimeContext,
      includeToolsContext: telemetry?.includeToolsContext,
    });

    // 承诺确保事件处理器已完全处理该步骤
    // 在开始新的步骤之前。这是必需的，因为继续条件
    // 需要更新的步骤来确定是否需要另一个步骤。
    let stepFinish!: DelayedPromise<void>;

    let recordedContent: Array<ContentPart<TOOLS>> = [];
    let recordedFinishReason: FinishReason | undefined = undefined;
    let recordedRawFinishReason: string | undefined = undefined;
    let recordedTotalUsage: LanguageModelUsage | undefined = undefined;
    let recordedRequest: Omit<LanguageModelRequestMetadata, 'messages'> = {};
    let recordedRequestMessages: Array<ModelMessage> = [];
    let recordedWarnings: Array<CallWarning> = [];
    const recordedSteps: StepResult<TOOLS, RUNTIME_CONTEXT>[] = [];
    const initialResponseMessages: Array<ResponseMessage> = [];
    let stepMessagesForNextStep: Array<ModelMessage> | undefined;
    let currentStepMessages: Array<ModelMessage> = [];

    // 跟踪提供者执行的支持延迟结果的工具调用
    // （例如，编程工具调用场景中的 code_execution）。
    // 这些工具可能不会在调用的同时返回结果。
    const pendingDeferredToolCalls = new Map<string, { toolName: string }>();

    let activeTextContent: Record<
      string,
      {
        type: 'text';
        text: string;
        providerMetadata: ProviderMetadata | undefined;
      }
    > = {};

    let activeReasoningContent: Record<
      string,
      {
        type: 'reasoning';
        text: string;
        providerMetadata: ProviderMetadata | undefined;
      }
    > = {};

    const eventProcessor = new TransformStream<
      EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>,
      EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>
    >({
      async transform(chunk, controller) {
        controller.enqueue(chunk); // 将块转发到下一个流

        const { part } = chunk;

        if (
          part.type === 'text-delta' ||
          part.type === 'reasoning-delta' ||
          part.type === 'custom' ||
          part.type === 'source' ||
          part.type === 'tool-call' ||
          part.type === 'tool-result' ||
          part.type === 'tool-input-start' ||
          part.type === 'tool-input-delta' ||
          part.type === 'raw'
        ) {
          await onChunk?.({ chunk: part });
        }

        if (part.type === 'error') {
          await onError({ error: wrapGatewayError(part.error) });
        }

        if (
          part.type === 'custom' ||
          part.type === 'source' ||
          part.type === 'tool-call' ||
          part.type === 'tool-approval-request' ||
          part.type === 'tool-approval-response' ||
          part.type === 'tool-error'
        ) {
          recordedContent.push(part);
        }

        if (part.type === 'text-start') {
          activeTextContent[part.id] = {
            type: 'text',
            text: '',
            providerMetadata: part.providerMetadata,
          };

          recordedContent.push(activeTextContent[part.id]);
        }

        if (part.type === 'text-delta') {
          const activeText = activeTextContent[part.id];

          if (activeText == null) {
            controller.enqueue({
              part: {
                type: 'error',
                error: `text part ${part.id} not found`,
              },
              partialOutput: undefined,
            });
            return;
          }

          activeText.text += part.text;
          activeText.providerMetadata =
            part.providerMetadata ?? activeText.providerMetadata;
        }

        if (part.type === 'text-end') {
          const activeText = activeTextContent[part.id];

          if (activeText == null) {
            controller.enqueue({
              part: {
                type: 'error',
                error: `text part ${part.id} not found`,
              },
              partialOutput: undefined,
            });
            return;
          }

          activeText.providerMetadata =
            part.providerMetadata ?? activeText.providerMetadata;

          delete activeTextContent[part.id];
        }

        if (part.type === 'reasoning-start') {
          activeReasoningContent[part.id] = {
            type: 'reasoning',
            text: '',
            providerMetadata: part.providerMetadata,
          };

          recordedContent.push(activeReasoningContent[part.id]);
        }

        if (part.type === 'reasoning-delta') {
          const activeReasoning = activeReasoningContent[part.id];

          if (activeReasoning == null) {
            controller.enqueue({
              part: {
                type: 'error',
                error: `reasoning part ${part.id} not found`,
              },
              partialOutput: undefined,
            });
            return;
          }

          activeReasoning.text += part.text;
          activeReasoning.providerMetadata =
            part.providerMetadata ?? activeReasoning.providerMetadata;
        }

        if (part.type === 'reasoning-end') {
          const activeReasoning = activeReasoningContent[part.id];

          if (activeReasoning == null) {
            controller.enqueue({
              part: {
                type: 'error',
                error: `reasoning part ${part.id} not found`,
              },
              partialOutput: undefined,
            });
            return;
          }

          activeReasoning.providerMetadata =
            part.providerMetadata ?? activeReasoning.providerMetadata;

          delete activeReasoningContent[part.id];
        }

        if (part.type === 'file' || part.type === 'reasoning-file') {
          recordedContent.push({
            type: part.type,
            file: part.file,
            ...(part.providerMetadata != null
              ? { providerMetadata: part.providerMetadata }
              : {}),
          });
        }

        if (part.type === 'tool-result' && !part.preliminary) {
          recordedContent.push(part);
        }

        if (part.type === 'start-step') {
          // 当新的步骤开始时重置记录的数据：
          recordedContent = [];
          activeReasoningContent = {};
          activeTextContent = {};

          recordedRequest = part.request;
          recordedWarnings = part.warnings;
        }

        if (part.type === 'finish-step') {
          const stepResponseMessages = await toResponseMessages({
            content: recordedContent,
            tools,
          });

          // 添加步骤信息（响应消息更新后）：
          const currentStepResult: StepResult<TOOLS, RUNTIME_CONTEXT> =
            new DefaultStepResult({
              callId,
              stepNumber: recordedSteps.length,
              provider: model.provider,
              modelId: model.modelId,
              runtimeContext,
              toolsContext,
              content: recordedContent,
              finishReason: part.finishReason,
              rawFinishReason: part.rawFinishReason,
              usage: part.usage,
              performance: part.performance,
              warnings: recordedWarnings,
              request: {
                ...recordedRequest,
                messages: include.requestMessages
                  ? cloneModelMessages(recordedRequestMessages)
                  : undefined,
              },
              response: {
                ...part.response,
                messages: cloneModelMessages(stepResponseMessages),
              },
              providerMetadata: part.providerMetadata,
            });

          await notify({
            event: currentStepResult,
            callbacks: [onStepFinish, telemetryDispatcher.onStepFinish],
          });

          logWarnings({
            warnings: recordedWarnings,
            provider: model.provider,
            model: model.modelId,
          });

          recordedSteps.push(currentStepResult);
          stepMessagesForNextStep = [
            ...currentStepMessages,
            ...stepResponseMessages,
          ];

          // 解决承诺以表明该步骤已完全处理
          // 通过事件处理器：
          stepFinish.resolve();
        }

        if (part.type === 'finish') {
          recordedTotalUsage = part.totalUsage;
          recordedFinishReason = part.finishReason;
          recordedRawFinishReason = part.rawFinishReason;
        }
      },

      async flush(controller) {
        try {
          if (recordedSteps.length === 0) {
            const error = abortSignal?.aborted
              ? abortSignal.reason
              : new NoOutputGeneratedError({
                  message: 'No output generated. Check the stream for errors.',
                });

            self._finishReason.reject(error);
            self._rawFinishReason.reject(error);
            self._totalUsage.reject(error);
            self._steps.reject(error);
            self._initialResponseMessages.reject(error);

            return; // 没有记录任何步骤（例如，在错误情况下）
          }

          // 衍生的：
          const finishReason = recordedFinishReason ?? 'other';
          const totalUsage =
            recordedTotalUsage ?? createNullLanguageModelUsage();

          // 从完成：
          self._finishReason.resolve(finishReason);
          self._rawFinishReason.resolve(recordedRawFinishReason);
          self._totalUsage.resolve(totalUsage);

          // 汇总结果：
          self._steps.resolve(recordedSteps);

          // 调用 onFinish 回调：
          const finalStep = recordedSteps[recordedSteps.length - 1];
          const files = recordedSteps.flatMap(step => step.files);
          const warnings = recordedSteps.flatMap(step => step.warnings ?? []);

          await notify({
            event: {
              callId,
              toolsContext: finalStep.toolsContext,
              stepNumber: finalStep.stepNumber,
              model: finalStep.model,
              runtimeContext: finalStep.runtimeContext,
              finishReason: finalStep.finishReason,
              rawFinishReason: finalStep.rawFinishReason,
              totalUsage,
              usage: finalStep.usage,
              content: finalStep.content,
              text: finalStep.text,
              reasoningText: finalStep.reasoningText,
              reasoning: finalStep.reasoning,
              files,
              sources: finalStep.sources,
              toolCalls: finalStep.toolCalls,
              staticToolCalls: finalStep.staticToolCalls,
              dynamicToolCalls: finalStep.dynamicToolCalls,
              toolResults: finalStep.toolResults,
              staticToolResults: finalStep.staticToolResults,
              dynamicToolResults: finalStep.dynamicToolResults,
              request: finalStep.request,
              response: finalStep.response,
              responseMessages: [
                ...initialResponseMessages,
                ...recordedSteps.flatMap(step => step.response.messages),
              ],
              warnings,
              providerMetadata: finalStep.providerMetadata,
              steps: recordedSteps,
            },
            callbacks: [onFinish, telemetryDispatcher.onEnd],
          });
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // 初始化可缝合流和转换后的流：
    const stitchableStream = createStitchableStream<TextStreamPart<TOOLS>>();
    this.addStream = stitchableStream.addStream;
    this.closeStream = stitchableStream.close;

    // 处理中止信号和错误的弹性流：
    const reader = stitchableStream.stream.getReader();
    let stream = new ReadableStream<TextStreamPart<TOOLS>>({
      async start(controller) {
        // 发送开始事件：
        controller.enqueue({ type: 'start' });
      },

      async pull(controller) {
        // 中止处理：
        function abort() {
          onAbort?.({ steps: recordedSteps });
          controller.enqueue({
            type: 'abort',
            // `reason` 通常是 DOMException 类型，但也可以是任何类型，
            // 因此我们使用 getErrorMessage 进行序列化，因为它已经被设计为接受未知类型的值。
            // 请参阅：https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/reason
            ...(abortSignal?.reason !== undefined
              ? { reason: getErrorMessage(abortSignal.reason) }
              : {}),
          });
          controller.close();
        }

        try {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            return;
          }

          if (abortSignal?.aborted) {
            abort();
            return;
          }

          controller.enqueue(value);
        } catch (error) {
          if (isAbortError(error) && abortSignal?.aborted) {
            abort();
          } else {
            controller.error(error);
          }
        }
      },

      cancel(reason) {
        return stitchableStream.stream.cancel(reason);
      },
    });

    // 引入一个门来防止进一步的令牌
    // 在转换调用 stopStream 后发出
    let isRunning = true;
    stream = stream.pipeThrough(
      new TransformStream({
        async transform(chunk, controller) {
          if (isRunning) {
            controller.enqueue(chunk);
          }
        },
      }),
    );

    // 在输出解析之前转换流
    // 启用流段替换：
    for (const transform of transforms) {
      stream = stream.pipeThrough(
        transform({
          tools: tools as TOOLS,
          stopStream() {
            stitchableStream.terminate();
            isRunning = false;
          },
        }),
      );
    }

    this.baseStream = stream
      .pipeThrough(createOutputTransformStream(output ?? text()))
      .pipeThrough(eventProcessor);

    const { maxRetries } = prepareRetries({
      maxRetries: maxRetriesArg,
      abortSignal,
    });

    const callSettings = prepareLanguageModelCallOptions(settings);

    const self = this;

    const callId = generateCallId();

    (async () => {
      const initialPrompt = await standardizePrompt({
        instructions,
        system,
        prompt,
        messages,
        allowSystemInMessages,
      } as Prompt);

      await notify({
        event: {
          callId,
          operationId: 'ai.streamText',
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
          headers,
          providerOptions,
          output,
          runtimeContext,
          toolsContext,
        },
        callbacks: [onStart, telemetryDispatcher.onStart],
      });

      const initialMessages = initialPrompt.messages;
      let instructionsForNextStep = initialPrompt.instructions;

      const { approvedToolApprovals, deniedToolApprovals } =
        collectToolApprovals<TOOLS>({ messages: initialMessages });

      // 初始工具执行步骤流
      if (deniedToolApprovals.length > 0 || approvedToolApprovals.length > 0) {
        const localApprovedToolApprovals = approvedToolApprovals.filter(
          toolApproval => !toolApproval.toolCall.providerExecuted,
        );
        const localDeniedToolApprovals = deniedToolApprovals.filter(
          toolApproval => !toolApproval.toolCall.providerExecuted,
        );

        const deniedProviderExecutedToolApprovals = deniedToolApprovals.filter(
          toolApproval => toolApproval.toolCall.providerExecuted,
        );

        let toolExecutionStepStreamController:
          | ReadableStreamDefaultController<TextStreamPart<TOOLS>>
          | undefined;
        const toolExecutionStepStream = new ReadableStream<
          TextStreamPart<TOOLS>
        >({
          start(controller) {
            toolExecutionStepStreamController = controller;
          },
        });

        self.addStream(toolExecutionStepStream);

        try {
          for (const toolApproval of [
            ...localDeniedToolApprovals,
            ...deniedProviderExecutedToolApprovals,
          ]) {
            toolExecutionStepStreamController?.enqueue({
              type: 'tool-output-denied',
              toolCallId: toolApproval.toolCall.toolCallId,
              toolName: toolApproval.toolCall.toolName,
            } as StaticToolOutputDenied<TOOLS>);
          }

          const toolOutputs: Array<ToolOutput<TOOLS>> = [];

          await Promise.all(
            localApprovedToolApprovals.map(async toolApproval => {
              const result = await executeToolCall({
                toolCall: toolApproval.toolCall,
                tools,
                callId,
                messages: initialMessages,
                abortSignal,
                timeout,
                experimental_sandbox: sandbox,
                toolsContext,
                onToolExecutionStart: filterNullable(
                  onToolExecutionStart,
                  telemetryDispatcher.onToolExecutionStart,
                ),
                onToolExecutionEnd: filterNullable(
                  onToolExecutionEnd,
                  telemetryDispatcher.onToolExecutionEnd,
                ),
                executeToolInTelemetryContext: telemetryDispatcher.executeTool,
                onPreliminaryToolResult: result => {
                  toolExecutionStepStreamController?.enqueue(result);
                },
              });

              if (result != null) {
                toolExecutionStepStreamController?.enqueue(result.output);
                toolOutputs.push(result.output);
              }
            }),
          );

          // 本地工具结果（批准+拒绝）作为工具结果发送：
          if (toolOutputs.length > 0 || localDeniedToolApprovals.length > 0) {
            const localToolContent: ToolContent = [];

            // 为批准的工具调用添加常规工具结果：
            for (const output of toolOutputs) {
              localToolContent.push({
                type: 'tool-result' as const,
                toolCallId: output.toolCallId,
                toolName: output.toolName,
                output: await createToolModelOutput({
                  toolCallId: output.toolCallId,
                  input: output.input,
                  tool: tools?.[output.toolName],
                  output:
                    output.type === 'tool-result'
                      ? output.output
                      : output.error,
                  errorMode: output.type === 'tool-error' ? 'text' : 'none',
                }),
              });
            }

            // add execution denied tool results for denied local tool approvals:
            for (const toolApproval of localDeniedToolApprovals) {
              localToolContent.push({
                type: 'tool-result' as const,
                toolCallId: toolApproval.toolCall.toolCallId,
                toolName: toolApproval.toolCall.toolName,
                output: {
                  type: 'execution-denied' as const,
                  reason: toolApproval.approvalResponse.reason,
                },
              });
            }

            initialResponseMessages.push({
              role: 'tool',
              content: localToolContent,
            });
          }
        } finally {
          toolExecutionStepStreamController?.close();
        }
      }

      self._initialResponseMessages.resolve(initialResponseMessages);

      async function streamStep({
        currentStep,
        usage,
      }: {
        currentStep: number;
        usage: LanguageModelUsage;
      }) {
        // 如果已配置，请设置步骤超时
        const stepTimeoutId = setAbortTimeout({
          abortController: stepAbortController,
          label: 'Step',
          timeoutMs: stepTimeoutMs,
        });

        // 设置块超时跟踪（将在每个块上重置）
        let chunkTimeoutId: ReturnType<typeof setTimeout> | undefined =
          undefined;

        function resetChunkTimeout() {
          if (chunkTimeoutId != null) {
            clearTimeout(chunkTimeoutId);
          }
          chunkTimeoutId = setAbortTimeout({
            abortController: chunkAbortController,
            label: 'Chunk',
            timeoutMs: chunkTimeoutMs,
          });
        }

        function clearChunkTimeout() {
          if (chunkTimeoutId != null) {
            clearTimeout(chunkTimeoutId);
            chunkTimeoutId = undefined;
          }
        }

        function clearStepTimeout() {
          if (stepTimeoutId != null) {
            clearTimeout(stepTimeoutId);
          }
        }

        try {
          stepFinish = new DelayedPromise<void>();

          const responseMessagesFromPreviousSteps = recordedSteps.flatMap(
            step => step.response.messages,
          );
          const accumulatedResponseMessages = [
            ...initialResponseMessages,
            ...responseMessagesFromPreviousSteps,
          ];
          const stepInputMessages = stepMessagesForNextStep ?? [
            ...initialMessages,
            ...initialResponseMessages,
          ];

          const prepareStepResult = await prepareStep?.({
            model,
            steps: recordedSteps,
            stepNumber: recordedSteps.length,
            instructions: instructionsForNextStep,
            initialInstructions: initialPrompt.instructions,
            messages: stepInputMessages,
            initialMessages,
            responseMessages: accumulatedResponseMessages,
            toolsContext,
            runtimeContext,
            experimental_sandbox: sandbox,
          });

          const stepSandbox =
            prepareStepResult?.experimental_sandbox ?? sandbox;

          runtimeContext = prepareStepResult?.runtimeContext ?? runtimeContext;
          toolsContext = prepareStepResult?.toolsContext ?? toolsContext;

          const stepModel = resolveLanguageModel(
            prepareStepResult?.model ?? model,
          );

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
          currentStepMessages = stepMessages;
          const stepInstructions =
            prepareStepResult?.instructions ??
            prepareStepResult?.system ??
            instructionsForNextStep;
          instructionsForNextStep = stepInstructions;

          const stepProviderOptions = mergeObjects(
            providerOptions,
            prepareStepResult?.providerOptions,
          );

          const stepStartTimestampMs = now();

          const { retry } = prepareRetries({ maxRetries, abortSignal });

          const {
            stream: languageModelStream,
            request,
            response,
          } = await retry(async () =>
            streamLanguageModelCall({
              model: prepareStepResult?.model ?? model,
              tools: stepActiveTools,
              toolChoice: prepareStepResult?.toolChoice ?? toolChoice,
              instructions: stepInstructions,
              messages: stepMessages,
              allowSystemInMessages,
              repairToolCall,
              refineToolInput,
              abortSignal,
              headers,
              includeRawChunks: include.rawChunks,
              providerOptions: stepProviderOptions,
              download,
              output,
              callId,
              toolsContext,
              experimental_sandbox: stepSandbox,
              onLanguageModelCallStart: filterNullable(
                onLanguageModelCallStart,
                telemetryDispatcher.onLanguageModelCallStart as
                  | undefined
                  | OnLanguageModelCallStartCallback,
              ),
              onLanguageModelCallEnd: filterNullable(
                onLanguageModelCallEnd,
                telemetryDispatcher.onLanguageModelCallEnd as
                  | undefined
                  | OnLanguageModelCallEndCallback<TOOLS>,
              ),
              onStart: async ({ promptMessages }) => {
                await notify({
                  event: {
                    callId,
                    provider: stepModel.provider,
                    modelId: stepModel.modelId,
                    stepNumber: recordedSteps.length,
                    instructions: stepInstructions,
                    messages: stepMessages,
                    tools,
                    toolChoice: prepareStepResult?.toolChoice ?? toolChoice,
                    activeTools: prepareStepResult?.activeTools ?? activeTools,
                    steps: [...recordedSteps],
                    providerOptions: stepProviderOptions,
                    runtimeContext,
                    toolsContext,
                    output,
                    promptMessages,
                    stepTools,
                    stepToolChoice,
                  },
                  callbacks: [onStepStart, telemetryDispatcher.onStepStart],
                });
              },
              _internal: {
                now,
              },
              ...callSettings,
            }),
          );

          const streamAfterToolCallbackInvocation =
            invokeToolCallbacksFromStream({
              stream: languageModelStream,
              tools,
              stepInputMessages: stepMessages,
              abortSignal,
              runtimeContext,
            });

          const streamWithToolResults = executeToolsFromStream({
            stream: streamAfterToolCallbackInvocation,
            tools,
            callId,
            messages: stepMessages,
            abortSignal,
            timeout,
            experimental_sandbox: stepSandbox,
            toolsContext,
            toolApproval,
            runtimeContext,
            generateId,

            // 回调需要由executeToolCall向下传递和处理
            // 确保在工具执行函数之前调用 onToolExecutionStart 回调
            onToolExecutionStart: filterNullable(
              onToolExecutionStart,
              telemetryDispatcher.onToolExecutionStart,
            ),
            onToolExecutionEnd: filterNullable(
              onToolExecutionEnd,
              telemetryDispatcher.onToolExecutionEnd,
            ),

            executeToolInTelemetryContext: telemetryDispatcher.executeTool,
          });

          // 根据包含设置有条件地包含 request.body。
          // 大负载（例如，base64 编码的图像）可能会导致内存问题。
          const stepRequest: LanguageModelRequestMetadata = {
            ...request,
            body: include.requestBody ? request?.body : undefined,
            messages: include.requestMessages
              ? cloneModelMessages(stepMessages)
              : undefined,
          };
          recordedRequestMessages = stepRequest.messages ?? [];

          const stepToolCalls: TypedToolCall<TOOLS>[] = [];
          const stepToolOutputs: ToolOutput<TOOLS>[] = [];
          const stepToolApprovalResponses: ToolApprovalResponse[] = [];
          let warnings: SharedV4Warning[] | undefined;

          let stepFinishReason: FinishReason = 'other';
          let stepRawFinishReason: string | undefined = undefined;

          let stepUsage: LanguageModelUsage = createNullLanguageModelUsage();
          let stepProviderMetadata: ProviderMetadata | undefined;
          let stepFirstChunk = true;
          let responseTimeMs = 0;
          let effectiveOutputTokensPerSecond = 0;
          let outputTokensPerSecond: number | undefined;
          let inputTokensPerSecond: number | undefined;
          let effectiveTotalTokensPerSecond = 0;
          const toolExecutionMs: Record<string, number> = {};
          let timeToFirstOutputTokenMs: number | undefined;
          let stepResponse: { id: string; timestamp: Date; modelId: string } = {
            id: generateId(),
            timestamp: new Date(),
            modelId: model.modelId,
          };

          self.addStream(
            streamWithToolResults.pipeThrough(
              new TransformStream<
                ExecuteToolsStreamPart<TOOLS>,
                TextStreamPart<TOOLS>
              >({
                async transform(chunk, controller): Promise<void> {
                  resetChunkTimeout();

                  if (chunk.type === 'model-call-start') {
                    warnings = chunk.warnings;
                    return; // 流起始块立即发送，不计为第一个块
                  }

                  if (stepFirstChunk) {
                    stepFirstChunk = false;

                    // 步骤开始：
                    controller.enqueue({
                      type: 'start-step',
                      request: stepRequest,
                      warnings: warnings ?? [],
                    });
                  }

                  const chunkType = chunk.type;
                  switch (chunkType) {
                    case 'file':
                    case 'custom':
                    case 'source':
                    case 'text-start':
                    case 'text-end':
                    case 'reasoning-start':
                    case 'reasoning-end':
                    case 'reasoning-delta':
                    case 'reasoning-file':
                    case 'tool-input-start':
                    case 'tool-input-end':
                    case 'tool-input-delta':
                    case 'tool-approval-request': {
                      controller.enqueue(chunk);
                      break;
                    }

                    case 'text-delta': {
                      if (chunk.text.length > 0) {
                        controller.enqueue(chunk);
                      }
                      break;
                    }

                    case 'tool-call': {
                      controller.enqueue(chunk);
                      // 存储工具调用 onFinish 回调和 toolCalls 承诺：
                      stepToolCalls.push(chunk);
                      break;
                    }

                    case 'tool-approval-response': {
                      controller.enqueue(chunk);
                      stepToolApprovalResponses.push(chunk);
                      break;
                    }

                    case 'tool-result': {
                      controller.enqueue(chunk);

                      if (!chunk.preliminary) {
                        stepToolOutputs.push(chunk);
                      }

                      break;
                    }

                    case 'tool-error': {
                      controller.enqueue(chunk);
                      stepToolOutputs.push(chunk);
                      break;
                    }

                    case 'tool-execution-end': {
                      toolExecutionMs[chunk.toolCallId] = chunk.toolExecutionMs;
                      break;
                    }

                    case 'model-call-response-metadata': {
                      stepResponse = {
                        id: chunk.id ?? stepResponse.id,
                        timestamp: chunk.timestamp ?? stepResponse.timestamp,
                        modelId: chunk.modelId ?? stepResponse.modelId,
                      };
                      break;
                    }

                    case 'model-call-end': {
                      // 注意：发出完成事件时，工具执行可能尚未完成。
                      // 存储承诺和 onFinish 回调的使用情况和完成原因：
                      stepUsage = chunk.usage;
                      stepFinishReason = chunk.finishReason;
                      stepRawFinishReason = chunk.rawFinishReason;
                      stepProviderMetadata = chunk.providerMetadata;
                      responseTimeMs = chunk.performance.responseTimeMs;
                      effectiveOutputTokensPerSecond =
                        chunk.performance.effectiveOutputTokensPerSecond;
                      outputTokensPerSecond =
                        chunk.performance.outputTokensPerSecond;
                      inputTokensPerSecond =
                        chunk.performance.inputTokensPerSecond;
                      effectiveTotalTokensPerSecond =
                        chunk.performance.effectiveTotalTokensPerSecond;
                      timeToFirstOutputTokenMs =
                        chunk.performance.timeToFirstOutputTokenMs;

                      break;
                    }

                    case 'error': {
                      controller.enqueue(chunk);
                      stepFinishReason = 'error';
                      break;
                    }

                    case 'raw': {
                      if (include.rawChunks) {
                        controller.enqueue(chunk);
                      }
                      break;
                    }

                    default: {
                      const exhaustiveCheck: never = chunkType;
                      throw new Error(`Unknown chunk type: ${exhaustiveCheck}`);
                    }
                  }
                },

                // 当流即将关闭时调用 onFinish 回调并解析 toolResults 承诺：
                async flush(controller) {
                  const stepTimeMs = now() - stepStartTimestampMs;

                  const finishStepPart: TextStreamPart<TOOLS> = {
                    type: 'finish-step',
                    finishReason: stepFinishReason,
                    rawFinishReason: stepRawFinishReason,
                    usage: stepUsage,
                    performance: {
                      stepTimeMs,
                      responseTimeMs,
                      effectiveOutputTokensPerSecond,
                      outputTokensPerSecond,
                      inputTokensPerSecond,
                      effectiveTotalTokensPerSecond,
                      toolExecutionMs,
                      timeToFirstOutputTokenMs,
                    },
                    providerMetadata: stepProviderMetadata,
                    response: {
                      ...stepResponse,
                      headers: response?.headers,
                    },
                  };

                  controller.enqueue(finishStepPart);

                  const combinedUsage = addLanguageModelUsage(usage, stepUsage);

                  // 等待事件处理器完全处理该步骤
                  // 确保记录的步骤完整：
                  await stepFinish.promise;

                  const clientToolCalls = stepToolCalls.filter(
                    toolCall => toolCall.providerExecuted !== true,
                  );
                  const clientToolOutputs = stepToolOutputs.filter(
                    toolOutput => toolOutput.providerExecuted !== true,
                  );
                  const deniedToolApprovalResponses =
                    stepToolApprovalResponses.filter(
                      toolApprovalResponse =>
                        toolApprovalResponse.approved === false,
                    );

                  // 跟踪提供者执行的支持延迟结果的工具调用。
                  // 在编程工具调用中，服务器工具（例如，code_execution）可以
                  // 触发客户端工具，并且服务器工具的结果被推迟到
                  // 客户端工具的结果被发回。
                  for (const toolCall of stepToolCalls) {
                    if (toolCall.providerExecuted !== true) continue;
                    const tool = tools?.[toolCall.toolName];
                    if (
                      tool?.type === 'provider' &&
                      tool.supportsDeferredResults
                    ) {
                      // 检查此工具调用在当前步骤中是否已有结果
                      const hasResultInStep = stepToolOutputs.some(
                        output =>
                          (output.type === 'tool-result' ||
                            output.type === 'tool-error') &&
                          output.toolCallId === toolCall.toolCallId,
                      );
                      if (!hasResultInStep) {
                        pendingDeferredToolCalls.set(toolCall.toolCallId, {
                          toolName: toolCall.toolName,
                        });
                      }
                    }
                  }

                  // 当我们收到结果时，将延迟的工具调用标记为已解决
                  for (const output of stepToolOutputs) {
                    if (
                      output.type === 'tool-result' ||
                      output.type === 'tool-error'
                    ) {
                      pendingDeferredToolCalls.delete(output.toolCallId);
                    }
                  }

                  // 在开始下一步之前清除步骤和块超时
                  clearStepTimeout();
                  clearChunkTimeout();

                  if (
                    // 如果出现以下情况，请继续：
                    // 1. 存在已全部执行或拒绝的客户端工具调用，或者
                    // 2. 提供商执行的工具有待处理的延迟结果，或者
                    ((clientToolCalls.length > 0 &&
                      clientToolCalls.length ===
                        clientToolOutputs.length +
                          deniedToolApprovalResponses.length) ||
                      pendingDeferredToolCalls.size > 0) &&
                    // 继续直到满足停止条件：
                    !(await isStopConditionMet({
                      stopConditions,
                      steps: recordedSteps,
                    }))
                  ) {
                    try {
                      await streamStep({
                        currentStep: currentStep + 1,
                        usage: combinedUsage,
                      });
                    } catch (error) {
                      controller.enqueue({
                        type: 'error',
                        error,
                      });

                      self.closeStream();
                    }
                  } else {
                    controller.enqueue({
                      type: 'finish',
                      finishReason: stepFinishReason,
                      rawFinishReason: stepRawFinishReason,
                      totalUsage: combinedUsage,
                    });

                    self.closeStream(); // 关闭可缝合流
                  }
                },
              }),
            ),
          );
        } finally {
          clearStepTimeout();
          clearChunkTimeout();
        }
      }

      // 将初始流添加到可缝合流
      await streamStep({
        currentStep: 0,
        usage: createNullLanguageModelUsage(),
      });
    })().catch(async error => {
      await telemetryDispatcher.onError?.({ callId, error });
      self._initialResponseMessages.reject(error);

      // 添加错误流部分并关闭流：
      self.addStream(
        new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'error', error });
            controller.close();
          },
        }),
      );
      self.closeStream();
    });
  }

  get steps() {
    // 当任何一个 Promise 被访问时，流就会被消耗
    // 所以它不需要单独消耗流就可以解决
    this.consumeStream();

    return this._steps.promise;
  }

  get finalStep() {
    return this.steps.then(steps => steps.at(-1)!);
  }

  get content() {
    return this.steps.then(steps => steps.flatMap(step => step.content));
  }

  get warnings() {
    return this.steps.then(steps => steps.flatMap(step => step.warnings ?? []));
  }

  get providerMetadata() {
    return this.finalStep.then(step => step.providerMetadata);
  }

  get text() {
    return this.finalStep.then(step => step.text);
  }

  get reasoningText() {
    return this.finalStep.then(step => step.reasoningText);
  }

  get reasoning() {
    return this.finalStep.then(step =>
      convertToReasoningOutputs(step.reasoning),
    );
  }

  get sources() {
    return this.steps.then(steps => steps.flatMap(step => step.sources));
  }

  get files() {
    return this.steps.then(steps => steps.flatMap(step => step.files));
  }

  get toolCalls() {
    return this.steps.then(steps => steps.flatMap(step => step.toolCalls));
  }

  get staticToolCalls() {
    return this.steps.then(steps =>
      steps.flatMap(step => step.staticToolCalls),
    );
  }

  get dynamicToolCalls() {
    return this.steps.then(steps =>
      steps.flatMap(step => step.dynamicToolCalls),
    );
  }

  get toolResults() {
    return this.steps.then(steps => steps.flatMap(step => step.toolResults));
  }

  get staticToolResults() {
    return this.steps.then(steps =>
      steps.flatMap(step => step.staticToolResults),
    );
  }

  get dynamicToolResults() {
    return this.steps.then(steps =>
      steps.flatMap(step => step.dynamicToolResults),
    );
  }

  get usage() {
    return this.totalUsage;
  }

  get request() {
    return this.finalStep.then(step => step.request);
  }

  get response() {
    return this.finalStep.then(step => step.response);
  }

  get responseMessages() {
    return Promise.all([
      this._initialResponseMessages.promise,
      this.steps,
    ]).then(([initialResponseMessages, steps]) => [
      ...initialResponseMessages,
      ...steps.flatMap(step => step.response.messages),
    ]);
  }

  get totalUsage() {
    // 当任何一个 Promise 被访问时，流就会被消耗
    // 所以它不需要单独消耗流就可以解决
    this.consumeStream();

    return this._totalUsage.promise;
  }

  get finishReason() {
    // 当任何一个 Promise 被访问时，流就会被消耗
    // 所以它不需要单独消耗流就可以解决
    this.consumeStream();

    return this._finishReason.promise;
  }

  get rawFinishReason() {
    // 当任何一个 Promise 被访问时，流就会被消耗
    // 所以它不需要单独消耗流就可以解决
    this.consumeStream();

    return this._rawFinishReason.promise;
  }

  /**
   * 从原始流中分离出一个新流。
   * 原始流被替换以允许进一步分割，
   * 因为我们不知道流将被分割多少次。
   *
   * 注意：这会导致在服务器上缓冲流内容。
   * 然而，法学硕士的结果预计足够小，不会引起问题。
   */
  private teeStream() {
    const [stream1, stream2] = this.baseStream.tee();
    this.baseStream = stream2;
    return stream1;
  }

  get textStream(): AsyncIterableStream<string> {
    return createAsyncIterableStream(
      this.teeStream().pipeThrough(
        new TransformStream<
          EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>,
          string
        >({
          transform({ part }, controller) {
            if (part.type === 'text-delta') {
              controller.enqueue(part.text);
            }
          },
        }),
      ),
    );
  }

  get fullStream(): AsyncIterableStream<TextStreamPart<TOOLS>> {
    return createAsyncIterableStream(
      this.teeStream().pipeThrough(
        new TransformStream<
          EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>,
          TextStreamPart<TOOLS>
        >({
          transform({ part }, controller) {
            controller.enqueue(part);
          },
        }),
      ),
    );
  }

  async consumeStream(options?: ConsumeStreamOptions): Promise<void> {
    try {
      await consumeStream({
        stream: this.fullStream,
        onError: options?.onError,
      });
    } catch (error) {
      options?.onError?.(error);
    }
  }

  get experimental_partialOutputStream(): AsyncIterableStream<
    InferPartialOutput<OUTPUT>
  > {
    return this.partialOutputStream;
  }

  get partialOutputStream(): AsyncIterableStream<InferPartialOutput<OUTPUT>> {
    return createAsyncIterableStream(
      this.teeStream().pipeThrough(
        new TransformStream<
          EnrichedStreamPart<TOOLS, InferPartialOutput<OUTPUT>>,
          InferPartialOutput<OUTPUT>
        >({
          transform({ partialOutput }, controller) {
            if (partialOutput != null) {
              controller.enqueue(partialOutput);
            }
          },
        }),
      ),
    );
  }

  get elementStream(): AsyncIterableStream<InferElementOutput<OUTPUT>> {
    const transform = this.outputSpecification?.createElementStreamTransform();

    if (transform == null) {
      throw new UnsupportedFunctionalityError({
        functionality: `element streams in ${
          this.outputSpecification?.name ?? 'text'
        } mode`,
      });
    }

    return createAsyncIterableStream(this.teeStream().pipeThrough(transform));
  }

  get output(): Promise<InferCompleteOutput<OUTPUT>> {
    return this.finalStep.then(step => {
      const output = this.outputSpecification ?? text();
      return output.parseCompleteOutput(
        { text: step.text },
        {
          response: step.response,
          usage: step.usage,
          finishReason: step.finishReason,
        },
      );
    });
  }

  toUIMessageStream<UI_MESSAGE extends UIMessage>({
    originalMessages,
    generateMessageId,
    onFinish,
    messageMetadata,
    sendReasoning = true,
    sendSources = false,
    sendStart = true,
    sendFinish = true,
    onError = getErrorMessage,
  }: UIMessageStreamOptions<UI_MESSAGE> = {}): AsyncIterableStream<
    InferUIMessageChunk<UI_MESSAGE>
  > {
    const responseMessageId =
      generateMessageId != null
        ? getResponseUIMessageId({
            originalMessages,
            responseMessageId: generateMessageId,
          })
        : undefined;

    // 一旦无效工具输入不再需要动态，TODO 就会简化
    const isDynamic = (part: { toolName: string; dynamic?: boolean }) => {
      const tool = this.tools?.[part.toolName];

      // 提供者执行的动态工具未在工具对象中列出
      if (tool == null) {
        return part.dynamic;
      }

      return tool?.type === 'dynamic' ? true : undefined;
    };

    const baseStream = this.fullStream.pipeThrough(
      new TransformStream<
        TextStreamPart<TOOLS>,
        UIMessageChunk<
          InferUIMessageMetadata<UI_MESSAGE>,
          InferUIMessageData<UI_MESSAGE>
        >
      >({
        transform: async (part, controller) => {
          const messageMetadataValue = messageMetadata?.({ part });

          const partType = part.type;
          switch (partType) {
            case 'text-start': {
              controller.enqueue({
                type: 'text-start',
                id: part.id,
                ...(part.providerMetadata != null
                  ? { providerMetadata: part.providerMetadata }
                  : {}),
              });
              break;
            }

            case 'text-delta': {
              controller.enqueue({
                type: 'text-delta',
                id: part.id,
                delta: part.text,
                ...(part.providerMetadata != null
                  ? { providerMetadata: part.providerMetadata }
                  : {}),
              });
              break;
            }

            case 'text-end': {
              controller.enqueue({
                type: 'text-end',
                id: part.id,
                ...(part.providerMetadata != null
                  ? { providerMetadata: part.providerMetadata }
                  : {}),
              });
              break;
            }

            case 'reasoning-start':
            case 'reasoning-end': {
              if (sendReasoning) {
                controller.enqueue({
                  type: partType,
                  id: part.id,
                  ...(part.providerMetadata != null
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                });
              }
              break;
            }

            case 'reasoning-delta': {
              if (sendReasoning) {
                controller.enqueue({
                  type: 'reasoning-delta',
                  id: part.id,
                  delta: part.text,
                  ...(part.providerMetadata != null
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                });
              }
              break;
            }

            case 'file':
            case 'reasoning-file': {
              if (partType !== 'reasoning-file' || sendReasoning) {
                controller.enqueue({
                  type: part.type,
                  mediaType: part.file.mediaType,
                  url: `data:${part.file.mediaType};base64,${part.file.base64}`,
                  ...(part.providerMetadata != null
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                });
              }
              break;
            }

            case 'source': {
              if (sendSources && part.sourceType === 'url') {
                controller.enqueue({
                  type: 'source-url',
                  sourceId: part.id,
                  url: part.url,
                  title: part.title,
                  ...(part.providerMetadata != null
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                });
              }

              if (sendSources && part.sourceType === 'document') {
                controller.enqueue({
                  type: 'source-document',
                  sourceId: part.id,
                  mediaType: part.mediaType,
                  title: part.title,
                  filename: part.filename,
                  ...(part.providerMetadata != null
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                });
              }
              break;
            }

            case 'custom': {
              controller.enqueue({
                type: 'custom',
                kind: part.kind,
                ...(part.providerMetadata != null
                  ? { providerMetadata: part.providerMetadata }
                  : {}),
              });
              break;
            }

            case 'tool-input-start': {
              const dynamic = isDynamic(part);

              controller.enqueue({
                type: 'tool-input-start',
                toolCallId: part.id,
                toolName: part.toolName,
                ...(part.providerExecuted != null
                  ? { providerExecuted: part.providerExecuted }
                  : {}),
                ...(part.providerMetadata != null
                  ? { providerMetadata: part.providerMetadata }
                  : {}),
                ...(part.toolMetadata != null
                  ? { toolMetadata: part.toolMetadata }
                  : {}),
                ...(dynamic != null ? { dynamic } : {}),
                ...(part.title != null ? { title: part.title } : {}),
              });
              break;
            }

            case 'tool-input-delta': {
              controller.enqueue({
                type: 'tool-input-delta',
                toolCallId: part.id,
                inputTextDelta: part.delta,
              });
              break;
            }

            case 'tool-call': {
              const dynamic = isDynamic(part);

              if (part.invalid) {
                controller.enqueue({
                  type: 'tool-input-error',
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  input: part.input,
                  ...(part.providerExecuted != null
                    ? { providerExecuted: part.providerExecuted }
                    : {}),
                  ...(part.providerMetadata != null
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                  ...(part.toolMetadata != null
                    ? { toolMetadata: part.toolMetadata }
                    : {}),
                  ...(dynamic != null ? { dynamic } : {}),
                  errorText: onError(part.error),
                  ...(part.title != null ? { title: part.title } : {}),
                });
              } else {
                controller.enqueue({
                  type: 'tool-input-available',
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  input: part.input,
                  ...(part.providerExecuted != null
                    ? { providerExecuted: part.providerExecuted }
                    : {}),
                  ...(part.providerMetadata != null
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                  ...(part.toolMetadata != null
                    ? { toolMetadata: part.toolMetadata }
                    : {}),
                  ...(dynamic != null ? { dynamic } : {}),
                  ...(part.title != null ? { title: part.title } : {}),
                });
              }

              break;
            }

            case 'tool-approval-request': {
              controller.enqueue({
                type: 'tool-approval-request',
                approvalId: part.approvalId,
                toolCallId: part.toolCall.toolCallId,
                ...(part.isAutomatic != null
                  ? { isAutomatic: part.isAutomatic }
                  : {}),
              });
              break;
            }

            case 'tool-approval-response': {
              controller.enqueue({
                type: 'tool-approval-response',
                approvalId: part.approvalId,
                approved: part.approved,
                ...(part.reason != null ? { reason: part.reason } : {}),
                ...(part.providerExecuted != null
                  ? { providerExecuted: part.providerExecuted }
                  : {}),
              });
              break;
            }

            case 'tool-result': {
              const dynamic = isDynamic(part);

              controller.enqueue({
                type: 'tool-output-available',
                toolCallId: part.toolCallId,
                output: part.output,
                ...(part.providerExecuted != null
                  ? { providerExecuted: part.providerExecuted }
                  : {}),
                ...(part.providerMetadata != null
                  ? { providerMetadata: part.providerMetadata }
                  : {}),
                ...(part.toolMetadata != null
                  ? { toolMetadata: part.toolMetadata }
                  : {}),
                ...(part.preliminary != null
                  ? { preliminary: part.preliminary }
                  : {}),
                ...(dynamic != null ? { dynamic } : {}),
              });
              break;
            }

            case 'tool-error': {
              const dynamic = isDynamic(part);

              controller.enqueue({
                type: 'tool-output-error',
                toolCallId: part.toolCallId,
                errorText: part.providerExecuted
                  ? typeof part.error === 'string'
                    ? part.error
                    : JSON.stringify(part.error)
                  : onError(part.error),
                ...(part.providerExecuted != null
                  ? { providerExecuted: part.providerExecuted }
                  : {}),
                ...(part.providerMetadata != null
                  ? { providerMetadata: part.providerMetadata }
                  : {}),
                ...(part.toolMetadata != null
                  ? { toolMetadata: part.toolMetadata }
                  : {}),
                ...(dynamic != null ? { dynamic } : {}),
              });
              break;
            }

            case 'tool-output-denied': {
              controller.enqueue({
                type: 'tool-output-denied',
                toolCallId: part.toolCallId,
              });
              break;
            }

            case 'error': {
              controller.enqueue({
                type: 'error',
                errorText: onError(part.error),
              });
              break;
            }

            case 'start-step': {
              controller.enqueue({ type: 'start-step' });
              break;
            }

            case 'finish-step': {
              controller.enqueue({ type: 'finish-step' });
              break;
            }

            case 'start': {
              if (sendStart) {
                controller.enqueue({
                  type: 'start',
                  ...(messageMetadataValue != null
                    ? { messageMetadata: messageMetadataValue }
                    : {}),
                  ...(responseMessageId != null
                    ? { messageId: responseMessageId }
                    : {}),
                });
              }
              break;
            }

            case 'finish': {
              if (sendFinish) {
                controller.enqueue({
                  type: 'finish',
                  finishReason: part.finishReason,
                  ...(messageMetadataValue != null
                    ? { messageMetadata: messageMetadataValue }
                    : {}),
                });
              }
              break;
            }

            case 'abort': {
              controller.enqueue(part);
              break;
            }

            case 'tool-input-end': {
              break;
            }

            case 'raw': {
              // 原始块不包含在 UI 消息流中
              // 因为它们包含供开发人员使用的特定于提供商的数据
              break;
            }

            default: {
              const exhaustiveCheck: never = partType;
              throw new Error(`Unknown chunk type: ${exhaustiveCheck}`);
            }
          }

          // 开始和结束事件已经有元数据
          // 所以我们只需要发送其他部分的元数据
          if (
            messageMetadataValue != null &&
            partType !== 'start' &&
            partType !== 'finish'
          ) {
            controller.enqueue({
              type: 'message-metadata',
              messageMetadata: messageMetadataValue,
            });
          }
        },
      }),
    );

    return createAsyncIterableStream(
      handleUIMessageStreamFinish<UI_MESSAGE>({
        stream: baseStream,
        messageId: responseMessageId ?? generateMessageId?.(),
        originalMessages,
        onFinish,
        onError,
      }),
    );
  }

  pipeUIMessageStreamToResponse<UI_MESSAGE extends UIMessage>(
    response: ServerResponse,
    {
      originalMessages,
      generateMessageId,
      onFinish,
      messageMetadata,
      sendReasoning,
      sendSources,
      sendFinish,
      sendStart,
      onError,
      ...init
    }: UIMessageStreamResponseInit & UIMessageStreamOptions<UI_MESSAGE> = {},
  ) {
    pipeUIMessageStreamToResponse({
      response,
      stream: this.toUIMessageStream({
        originalMessages,
        generateMessageId,
        onFinish,
        messageMetadata,
        sendReasoning,
        sendSources,
        sendFinish,
        sendStart,
        onError,
      }),
      ...init,
    });
  }

  pipeTextStreamToResponse(response: ServerResponse, init?: ResponseInit) {
    pipeTextStreamToResponse({
      response,
      textStream: this.textStream,
      ...init,
    });
  }

  toUIMessageStreamResponse<UI_MESSAGE extends UIMessage>({
    originalMessages,
    generateMessageId,
    onFinish,
    messageMetadata,
    sendReasoning,
    sendSources,
    sendFinish,
    sendStart,
    onError,
    ...init
  }: UIMessageStreamResponseInit &
    UIMessageStreamOptions<UI_MESSAGE> = {}): Response {
    return createUIMessageStreamResponse({
      stream: this.toUIMessageStream({
        originalMessages,
        generateMessageId,
        onFinish,
        messageMetadata,
        sendReasoning,
        sendSources,
        sendFinish,
        sendStart,
        onError,
      }),
      ...init,
    });
  }

  toTextStreamResponse(init?: ResponseInit): Response {
    return createTextStreamResponse({
      textStream: this.textStream,
      ...init,
    });
  }
}
