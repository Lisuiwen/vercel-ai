import type { ToolSet } from '@ai-sdk/provider-utils';
import type {
  EmbedEndEvent,
  EmbedStartEvent,
  EmbeddingModelCallEndEvent,
  EmbeddingModelCallStartEvent,
} from '../embed/embed-events';
import type {
  GenerateObjectEndEvent,
  GenerateObjectStartEvent,
  GenerateObjectStepEndEvent,
  GenerateObjectStepStartEvent,
} from '../generate-object/structured-output-events';
import type {
  GenerateTextEndEvent,
  GenerateTextStartEvent,
  GenerateTextStepEndEvent,
  GenerateTextStepStartEvent,
} from '../generate-text/generate-text-events';
import type {
  LanguageModelCallEndEvent,
  LanguageModelCallStartEvent,
  OnLanguageModelCallEndCallback,
  OnLanguageModelCallStartCallback,
} from '../generate-text/language-model-events';
import type {
  ToolExecutionEndEvent,
  ToolExecutionStartEvent,
} from '../generate-text/tool-execution-events';
import type {
  RerankEndEvent,
  RerankStartEvent,
  RerankingModelCallEndEvent,
  RerankingModelCallStartEvent,
} from '../rerank/rerank-events';
import type { Callback } from '../util/callback';
import type { TelemetryOptions } from '../telemetry/telemetry-options';

export type InferTelemetryEvent<EVENT> = EVENT &
  Omit<
    TelemetryOptions,
    'integrations' | 'isEnabled' | 'includeRuntimeContext'
  >;

type OperationStartEvent =
  | GenerateTextStartEvent
  | GenerateObjectStartEvent
  | EmbedStartEvent
  | RerankStartEvent;

type OperationEndEvent =
  | GenerateTextEndEvent<ToolSet>
  | GenerateObjectEndEvent<unknown>
  | EmbedEndEvent
  | RerankEndEvent;

export interface TelemetryDispatcher {
  onStart?: Callback<OperationStartEvent>;
  onStepStart?: Callback<GenerateTextStepStartEvent>;
  onLanguageModelCallStart?: OnLanguageModelCallStartCallback;
  onLanguageModelCallEnd?: OnLanguageModelCallEndCallback;
  onToolExecutionStart?: Callback<ToolExecutionStartEvent>;
  onToolExecutionEnd?: Callback<ToolExecutionEndEvent>;
  onStepFinish?: Callback<GenerateTextStepEndEvent>;
  onObjectStepStart?: Callback<GenerateObjectStepStartEvent>;
  onObjectStepFinish?: Callback<GenerateObjectStepEndEvent>;
  onEmbedStart?: Callback<EmbeddingModelCallStartEvent>;
  onEmbedEnd?: Callback<EmbeddingModelCallEndEvent>;
  onRerankStart?: Callback<RerankingModelCallStartEvent>;
  onRerankEnd?: Callback<RerankingModelCallEndEvent>;
  onEnd?: Callback<OperationEndEvent>;
  onError?: Callback<unknown>;
  executeTool?: Telemetry['executeTool'];
}

/**
 * 实现此接口以创建自定义遥测集成。
 * 方法可以同步或返回 PromiseLike。
 */
export interface Telemetry {
  /**
   * 当操作开始时调用。因文本生成而被激发
   * (generateText/streamText)、对象生成(generateObject/streamObject)、
   * 嵌入（embed/embedMany）和重新排序操作。
   *
   * 使用“operationId”字段来区分操作类型。
   */
  onStart?: Callback<InferTelemetryEvent<OperationStartEvent>>;

  /**
   * 当单个步骤（单个 LLM 调用）开始时调用。
   * 生成可能由多个步骤组成（例如，当工具调用触发器时
   * 后续LLM电话）。使用它来创建每步跨度或记录
   * 步进级输入。
   *
   * 该事件包括步骤编号、累计的前一步结果、
   * 以及将发送到模型的消息。
   */
  onStepStart?: Callback<InferTelemetryEvent<GenerateTextStepStartEvent>>;

  /**
   * 在提供者模型调用开始之前立即调用。
   * 与“onStepStart”不同，此回调的范围仅限于模型工作，并且
   * 排除任何后续的客户端工具执行。
   */
  onLanguageModelCallStart?: Callback<
    InferTelemetryEvent<LanguageModelCallStartEvent>
  >;

  /**
   * 在模型响应标准化和解析之后但之前调用
   * 任何客户端工具开始执行。
   */
  onLanguageModelCallEnd?: Callback<
    InferTelemetryEvent<LanguageModelCallEndEvent>
  >;

  /**
   * 当工具执行开始时，在工具的“execute”函数之前调用
   * 被调用。使用它来创建工具级跨度或记录工具调用。
   */
  onToolExecutionStart?: Callback<InferTelemetryEvent<ToolExecutionStartEvent>>;

  /**
   * 当工具执行成功或有错误完成时调用。
   * 该事件在“成功”字段上使用可区分联合 - 检查
   * `event.success` 来确定 `output` 或 `error` 是否可用。
   *
   * 该事件包括用于性能跟踪的执行时间（“toolExecutionMs”）。
   */
  onToolExecutionEnd?: Callback<InferTelemetryEvent<ToolExecutionEndEvent>>;

  /**
   * 当单个步骤（单个 LLM 调用）完成时调用。
   * 该事件是一个包含模型响应、工具调用的“StepResult”
   * 和结果、使用统计、完成原因和可选的请求/响应
   * 尸体。
   */
  onStepFinish?: Callback<InferTelemetryEvent<GenerateTextStepEndEvent>>;

  /**
   * 当对象生成步骤（单个 LLM 调用）开始时调用。
   * 对于generateObject/streamObject 总是只有一个步骤。
   *
   * @已弃用
   */
  onObjectStepStart?: Callback<
    InferTelemetryEvent<GenerateObjectStepStartEvent>
  >;

  /**
   * 当对象生成步骤（单个 LLM 调用）完成时调用，
   * 使用 JSON 解析和模式验证之前的原始结果。
   *
   * @已弃用
   */
  onObjectStepFinish?: Callback<
    InferTelemetryEvent<GenerateObjectStepEndEvent>
  >;

  /**
   * 当单独的嵌入模型调用 (doEmbed) 开始时调用。
   * 对于“embed”，只有一个调用。对于“embedMany”，可能有多个
   * 当值被分块时调用。
   */
  onEmbedStart?: Callback<InferTelemetryEvent<EmbeddingModelCallStartEvent>>;

  /**
   * 当单个嵌入模型调用 (doEmbed) 完成时调用。
   * 包含嵌入、用法以及模型响应中的任何警告。
   */
  onEmbedEnd?: Callback<InferTelemetryEvent<EmbeddingModelCallEndEvent>>;

  /**
   * 当单独的重新排序模型调用 (doRerank) 开始时调用。
   * 每次“rerank”调用都会有一次调用。
   */
  onRerankStart?: Callback<InferTelemetryEvent<RerankingModelCallStartEvent>>;

  /**
   * 当单独的重新排名模型调用 (doRerank) 完成时调用。
   * 包含模型响应的排名结果。
   */
  onRerankEnd?: Callback<InferTelemetryEvent<RerankingModelCallEndEvent>>;

  /**
   * 操作完成时调用。因文本生成而被激发
   * (generateText/streamText)、对象生成(generateObject/streamObject)、
   * 嵌入（embed/embedMany）和重新排序操作。
   *
   * 使用事件形状或“operationId”来区分操作类型。
   */
  onEnd?: Callback<InferTelemetryEvent<OperationEndEvent>>;

  /**
   * 当生成生命周期中发生不可恢复的错误时调用。
   * 错误值是无类型的——它可能是一个“Error”实例，一个“AISDKError”，
   * 或任何抛出的值。
   *
   * 使用它来记录遥测范围的错误详细信息并设置错误状态。
   */
  onError?: Callback<unknown>;

  /**
   * （可选）在特定于遥测集成的上下文中运行工具执行函数。这使得
   * 嵌套痕迹——例如当工具的“execute”函数调用“generateText”时，
   * 内部调用的跨度成为工具跨度的子代。
   *
   * @param options.callId - The call ID of the tool call.
   * @param options.toolCallId - The tool call ID.
   * @param options.execute - The function to execute.
   */
  executeTool?: <T>(options: {
    callId: string;
    toolCallId: string;
    execute: () => PromiseLike<T>;
  }) => PromiseLike<T>;
}
