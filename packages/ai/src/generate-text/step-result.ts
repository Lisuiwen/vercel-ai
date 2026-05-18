import type {
  Context,
  InferToolSetContext,
  ReasoningFilePart,
  ReasoningPart,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type {
  CallWarning,
  FinishReason,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata,
  ProviderMetadata,
} from '../types';
import type { Source } from '../types/language-model';
import type { LanguageModelUsage } from '../types/usage';
import type { ContentPart } from './content-part';
import type { GeneratedFile } from './generated-file';
import { asReasoningText } from './reasoning';
import {
  convertFromReasoningOutputs,
  type ReasoningFileOutput,
  type ReasoningOutput,
} from './reasoning-output';
import type {
  DynamicToolCall,
  StaticToolCall,
  TypedToolCall,
} from './tool-call';
import type {
  DynamicToolResult,
  StaticToolResult,
  TypedToolResult,
} from './tool-result';

/**
 * 生成过程中单个步骤的性能指标。
 */
export type StepResultPerformance = {
  /**
   * 完整语言模型每秒输出令牌的有效数量
   * 回应。
   *
   * 计算公式为`outputTokens / requestSeconds`。
   */
  readonly effectiveOutputTokensPerSecond: number;

  /**
   * 第一个输出令牌后每秒输出令牌的数量
   * 收到。
   *
   * 仅适用于流步骤。
   *
   * 计算公式为`outputTokens / outputStreamSeconds`。
   */
  readonly outputTokensPerSecond: number | undefined;

  /**
   * 在第一个输出令牌之前每秒处理的输入令牌数
   * 已收到。
   *
   * 仅适用于流步骤。
   *
   * 计算公式为`inputTokens / ttftSeconds`。
   */
  readonly inputTokensPerSecond: number | undefined;

  /**
   * 每秒输入和输出令牌的有效数量
   * 语言模型响应。
   *
   * 计算公式为`(inputTokens + outputTokens) / requestSeconds`。
   */
  readonly effectiveTotalTokensPerSecond: number;

  /**
   * 该步骤花费的总时间（以毫秒为单位）。
   */
  readonly stepTimeMs: number;

  /**
   * 等待语言模型响应所花费的时间（以毫秒为单位）。
   */
  readonly responseTimeMs: number;

  /**
   * 执行每个客户端工具调用所花费的时间（以毫秒为单位），由
   * 工具调用ID。
   */
  readonly toolExecutionMs: Readonly<Record<string, number>>;

  /**
   * 收到第一个文本、推理或工具输入增量所需的时间
   * 毫秒。
   *
   * 仅适用于流步骤。
   */
  readonly timeToFirstOutputTokenMs: number | undefined;
};

/**
 * 生成过程中单个步骤的结果。
 */
export type StepResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = {
  /**
   * 此步骤所属的生成调用的唯一标识符。
   */
  readonly callId: string;

  /**
   * 此步骤的从零开始的索引。
   */
  readonly stepNumber: number;

  /**
   * 有关生成此步骤的模型的信息。
   */
  readonly model: {
    /* * 模型的提供者。 */
    readonly provider: string;

    /* * 模型的ID。 */
    readonly modelId: string;
  };

  /**
   * 工具上下文。
   */
  readonly toolsContext: InferToolSetContext<TOOLS>;

  /**
   * 用作步骤输入的运行时上下文。
   */
  readonly runtimeContext: RUNTIME_CONTEXT;

  /**
   * 上一步生成的内容。
   */
  readonly content: Array<ContentPart<TOOLS>>;

  /**
   * 生成的文本。如果模型未生成任何文本，则可以为空字符串。
   */
  readonly text: string;

  /**
   * 在一代人中产生的推理。
   */
  readonly reasoning: Array<ReasoningPart | ReasoningFilePart>;

  /**
   * 生成过程中生成的推理文本。
   *
   * 它是所有推理部分的串联（但不包括推理文件部分）。
   * 如果模型仅生成文本，则可以未定义。
   */
  readonly reasoningText: string | undefined;

  /**
   * 生成过程中生成的文件。
   */
  readonly files: Array<GeneratedFile>;

  /**
   * 用于生成文本的来源。
   */
  readonly sources: Array<Source>;

  /**
   * 在生成期间进行的工具调用。
   */
  readonly toolCalls: Array<TypedToolCall<TOOLS>>;

  /**
   * 上一步中进行的静态工具调用。
   */
  readonly staticToolCalls: Array<StaticToolCall<TOOLS>>;

  /**
   * 上一步中进行的动态工具调用。
   */
  readonly dynamicToolCalls: Array<DynamicToolCall>;

  /**
   * 工具调用的结果。
   */
  readonly toolResults: Array<TypedToolResult<TOOLS>>;

  /**
   * 上一步中生成的静态工具结果。
   */
  readonly staticToolResults: Array<StaticToolResult<TOOLS>>;

  /**
   * 上一步中生成的动态工具结果。
   */
  readonly dynamicToolResults: Array<DynamicToolResult>;

  /**
   * 一代结束的统一原因。
   */
  readonly finishReason: FinishReason;

  /**
   * 生成完成的原始原因（来自提供者）。
   */
  readonly rawFinishReason: string | undefined;

  /**
   * 生成文本的标记使用情况。
   */
  readonly usage: LanguageModelUsage;

  /**
   * 该步骤的性能指标。
   */
  readonly performance: StepResultPerformance;

  /**
   * 来自模型提供商的警告（例如不支持的设置）。
   */
  readonly warnings: CallWarning[] | undefined;

  /**
   * 附加请求信息。
   */
  readonly request: LanguageModelRequestMetadata;

  /**
   * 附加响应信息。
   */
  readonly response: LanguageModelResponseMetadata;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从成功到AI SDK并实现成功特定的
   * 可以完全封装在提供者中的结果。
   */
  readonly providerMetadata: ProviderMetadata | undefined;
};

export class DefaultStepResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> implements StepResult<TOOLS, RUNTIME_CONTEXT> {
  readonly callId: StepResult<TOOLS, RUNTIME_CONTEXT>['callId'];
  readonly stepNumber: StepResult<TOOLS, RUNTIME_CONTEXT>['stepNumber'];
  readonly model: StepResult<TOOLS, RUNTIME_CONTEXT>['model'];
  readonly toolsContext: StepResult<TOOLS, RUNTIME_CONTEXT>['toolsContext'];
  readonly runtimeContext: StepResult<TOOLS, RUNTIME_CONTEXT>['runtimeContext'];
  readonly content: StepResult<TOOLS, RUNTIME_CONTEXT>['content'];
  readonly finishReason: StepResult<TOOLS, RUNTIME_CONTEXT>['finishReason'];
  readonly rawFinishReason: StepResult<
    TOOLS,
    RUNTIME_CONTEXT
  >['rawFinishReason'];
  readonly usage: StepResult<TOOLS, RUNTIME_CONTEXT>['usage'];
  readonly performance: StepResult<TOOLS, RUNTIME_CONTEXT>['performance'];
  readonly warnings: StepResult<TOOLS, RUNTIME_CONTEXT>['warnings'];
  readonly request: StepResult<TOOLS, RUNTIME_CONTEXT>['request'];
  readonly response: StepResult<TOOLS, RUNTIME_CONTEXT>['response'];
  readonly providerMetadata: StepResult<
    TOOLS,
    RUNTIME_CONTEXT
  >['providerMetadata'];

  constructor({
    callId,
    stepNumber,
    provider,
    modelId,
    runtimeContext,
    toolsContext,
    content,
    finishReason,
    rawFinishReason,
    usage,
    performance,
    warnings,
    request,
    response,
    providerMetadata,
  }: {
    callId: StepResult<TOOLS, RUNTIME_CONTEXT>['callId'];
    stepNumber: StepResult<TOOLS, RUNTIME_CONTEXT>['stepNumber'];
    provider: StepResult<TOOLS, RUNTIME_CONTEXT>['model']['provider'];
    modelId: StepResult<TOOLS, RUNTIME_CONTEXT>['model']['modelId'];
    runtimeContext: StepResult<TOOLS, RUNTIME_CONTEXT>['runtimeContext'];
    toolsContext: StepResult<TOOLS, RUNTIME_CONTEXT>['toolsContext'];
    content: StepResult<TOOLS, RUNTIME_CONTEXT>['content'];
    finishReason: StepResult<TOOLS, RUNTIME_CONTEXT>['finishReason'];
    rawFinishReason: StepResult<TOOLS, RUNTIME_CONTEXT>['rawFinishReason'];
    usage: StepResult<TOOLS, RUNTIME_CONTEXT>['usage'];
    performance: StepResult<TOOLS, RUNTIME_CONTEXT>['performance'];
    warnings: StepResult<TOOLS, RUNTIME_CONTEXT>['warnings'];
    request: StepResult<TOOLS, RUNTIME_CONTEXT>['request'];
    response: StepResult<TOOLS, RUNTIME_CONTEXT>['response'];
    providerMetadata: StepResult<TOOLS, RUNTIME_CONTEXT>['providerMetadata'];
  }) {
    this.callId = callId;
    this.stepNumber = stepNumber;
    this.model = { provider, modelId };
    this.runtimeContext = runtimeContext;
    this.toolsContext = toolsContext;
    this.content = content;
    this.finishReason = finishReason;
    this.rawFinishReason = rawFinishReason;
    this.usage = usage;
    this.performance = performance;
    this.warnings = warnings;
    this.request = request;
    this.response = response;
    this.providerMetadata = providerMetadata;
  }

  get text() {
    return this.content
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');
  }

  get reasoning(): Array<ReasoningPart | ReasoningFilePart> {
    return convertFromReasoningOutputs(
      this.content.filter(
        (part): part is ReasoningOutput | ReasoningFileOutput =>
          part.type === 'reasoning' || part.type === 'reasoning-file',
      ),
    );
  }

  get reasoningText() {
    return asReasoningText(this.reasoning);
  }

  get files() {
    return this.content
      .filter(part => part.type === 'file')
      .map(part => part.file);
  }

  get sources() {
    return this.content.filter(part => part.type === 'source');
  }

  get toolCalls() {
    return this.content.filter(part => part.type === 'tool-call');
  }

  get staticToolCalls() {
    return this.toolCalls.filter(
      (toolCall): toolCall is StaticToolCall<TOOLS> =>
        toolCall.dynamic !== true,
    );
  }

  get dynamicToolCalls() {
    return this.toolCalls.filter(
      (toolCall): toolCall is DynamicToolCall => toolCall.dynamic === true,
    );
  }

  get toolResults() {
    return this.content.filter(part => part.type === 'tool-result');
  }

  get staticToolResults() {
    return this.toolResults.filter(
      (toolResult): toolResult is StaticToolResult<TOOLS> =>
        toolResult.dynamic !== true,
    );
  }

  get dynamicToolResults() {
    return this.toolResults.filter(
      (toolResult): toolResult is DynamicToolResult =>
        toolResult.dynamic === true,
    );
  }
}
