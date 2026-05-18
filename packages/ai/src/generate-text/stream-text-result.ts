import type { JSONObject } from '@ai-sdk/provider';
import type { Context, IdGenerator, ToolSet } from '@ai-sdk/provider-utils';
import type { ServerResponse } from 'node:http';
import type {
  CallWarning,
  FinishReason,
  LanguageModelRequestMetadata,
  ProviderMetadata,
} from '../types';
import type { Source } from '../types/language-model';
import type { LanguageModelResponseMetadata } from '../types/language-model-response-metadata';
import type { LanguageModelUsage } from '../types/usage';
import type { InferUIMessageChunk } from '../ui-message-stream/ui-message-chunks';
import type { UIMessageStreamOnFinishCallback } from '../ui-message-stream/ui-message-stream-on-finish-callback';
import type { UIMessageStreamResponseInit } from '../ui-message-stream/ui-message-stream-response-init';
import type { InferUIMessageMetadata, UIMessage } from '../ui/ui-messages';
import type { AsyncIterableStream } from '../util/async-iterable-stream';
import type { ErrorHandler } from '../util/error-handler';
import type { ContentPart } from './content-part';
import type { GeneratedFile } from './generated-file';
import type { Output } from './output';
import type {
  InferCompleteOutput,
  InferElementOutput,
  InferPartialOutput,
} from './output-utils';
import type { ReasoningFileOutput, ReasoningOutput } from './reasoning-output';
import type { ResponseMessage } from './response-message';
import type { StepResult, StepResultPerformance } from './step-result';
import type { ToolApprovalRequestOutput } from './tool-approval-request-output';
import type { ToolApprovalResponseOutput } from './tool-approval-response-output';
import type {
  DynamicToolCall,
  StaticToolCall,
  TypedToolCall,
} from './tool-call';
import type { TypedToolError } from './tool-error';
import type { StaticToolOutputDenied } from './tool-output-denied';
import type {
  DynamicToolResult,
  StaticToolResult,
  TypedToolResult,
} from './tool-result';

export type UIMessageStreamOptions<UI_MESSAGE extends UIMessage> = {
  /**
   * 原始消息。如果提供了它们，则假定为持久模式，
   * 并为响应消息提供消息ID。
   */
  originalMessages?: UI_MESSAGE[];

  /**
   * 为响应消息生成消息ID。
   *
   * 如果未提供，则不会为响应消息设置消息ID（替代
   * 提供了原始消息，最后一条消息是辅助消息）。
   */
  generateMessageId?: IdGenerator;

  onFinish?: UIMessageStreamOnFinishCallback<UI_MESSAGE>;

  /**
   * 提取将发送到客户端的消息元数据。
   *
   * 调用`开始`和`结束`事件。
   */
  messageMetadata?: (options: {
    part: TextStreamPart<ToolSet>;
  }) => InferUIMessageMetadata<UI_MESSAGE> | undefined;

  /**
   * 将推理部分发送给客户。
   * 默认为 true。
   */
  sendReasoning?: boolean;

  /**
   * 将源部件发送给客户。
   * 默认为 false。
   */
  sendSources?: boolean;

  /**
   * 将完成事件发送给客户端。
   * 如果您使用额外的 StreamText 调用，则设置为 false
   * 发送附加数据。
   * 默认为 true。
   */
  sendFinish?: boolean;

  /**
   * 向客户端发送消息开始事件。
   * 如果您使用额外的 StreamText 调用，则设置为 false
   * 并且消息开始事件已经发送。
   * 默认为 true。
   */
  sendStart?: boolean;

  /**
   * 处理错误，例如记录它。默认为 `() => '发生错误。'`。
   *
   * @returns 要包含在数据流中的错误消息。
   */
  onError?: (error: unknown) => string;
};

export type ConsumeStreamOptions = {
  onError?: ErrorHandler;
};

/**
 * 用于访问不同流类型和附加信息的结果对象。
 */
export interface StreamTextResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
  OUTPUT extends Output,
> {
  /**
   * 所有步骤中生成的内容。
   *
   * 自动消耗流。
   */
  readonly content: PromiseLike<Array<ContentPart<TOOLS>>>;

  /**
   * 最后一步生成的全文。
   *
   * 自动消耗流。
   */
  readonly text: PromiseLike<string>;

  /**
   * 模型生成的完整推理。
   *
   * 自动消耗流。
   *
   * @deprecated 请改用`finalStep.reasoning`。
   */
  readonly reasoning: PromiseLike<Array<ReasoningOutput | ReasoningFileOutput>>;

  /**
   * 上一步生成的推理。
   *
   * 自动消耗流。
   *
   * @deprecated 请改用`finalStep.reasoningText`。
   */
  readonly reasoningText: PromiseLike<string | undefined>;

  /**
   * 模型在所有步骤中生成的文件。
   *
   * 自动消耗流。
   */
  readonly files: PromiseLike<GeneratedFile[]>;

  /**
   * 在所有步骤中用作参考的来源。
   *
   * 自动消耗流。
   */
  readonly sources: PromiseLike<Source[]>;

  /**
   * 所有步骤中已执行的工具调用。
   *
   * 自动消耗流。
   */
  readonly toolCalls: PromiseLike<TypedToolCall<TOOLS>[]>;

  /**
   * 所有步骤中已执行的静态工具调用。
   *
   * 自动消耗流。
   */
  readonly staticToolCalls: PromiseLike<StaticToolCall<TOOLS>[]>;

  /**
   * 所有步骤中已执行的动态工具调用。
   *
   * 自动消耗流。
   */
  readonly dynamicToolCalls: PromiseLike<DynamicToolCall[]>;

  /**
   * 所有步骤中生成的静态工具结果。
   *
   * 自动消耗流。
   */
  readonly staticToolResults: PromiseLike<StaticToolResult<TOOLS>[]>;

  /**
   * 所有步骤中生成的动态工具结果。
   *
   * 自动消耗流。
   */
  readonly dynamicToolResults: PromiseLike<DynamicToolResult[]>;

  /**
   * 所有步骤中生成的工具结果。
   *
   * 自动消耗流。
   */
  readonly toolResults: PromiseLike<TypedToolResult<TOOLS>[]>;

  /**
   * 统一完成原因是生成完成的。取自最后一步。
   *
   * 自动消耗流。
   */
  readonly finishReason: PromiseLike<FinishReason>;

  /**
   * 生成完成的原始原因（来自提供者）。取自最后一步。
   *
   * 自动消耗流。
   */
  readonly rawFinishReason: PromiseLike<string | undefined>;

  /**
   * 生成的响应的总令牌使用量。
   * 当有多个步骤时，使用量为所有步骤使用量的总和。
   *
   * 自动消耗流。
   */
  readonly usage: PromiseLike<LanguageModelUsage>;

  /**
   * 生成的响应的总令牌使用量。
   * 当有多个步骤时，使用量为所有步骤使用量的总和。
   *
   * 自动消耗流。
   *
   * @deprecated 请改用`最合适`。
   */
  readonly totalUsage: PromiseLike<LanguageModelUsage>;

  /**
   * 所有步骤中均来自模型提供者的警告（例如不支持的设置）。
   *
   * 自动消耗流。
   */
  readonly warnings: PromiseLike<CallWarning[] | undefined>;

  /**
   * 所有步骤的详细信息。
   * 您可以使用它来获取有关中间步骤的信息，
   * 例如工具调用或响应标头。
   *
   * 自动消耗流。
   */
  readonly steps: PromiseLike<Array<StepResult<TOOLS, RUNTIME_CONTEXT>>>;

  /**
   * 最后一步。这是`steps.at(-1)`的快捷方式。
   *
   * 自动消耗流。
   */
  readonly finalStep: PromiseLike<StepResult<TOOLS, RUNTIME_CONTEXT>>;

  /**
   * 上一步中的附加请求信息。
   *
   * 自动消耗流。
   *
   * @deprecated 请改用`finalStep.request`。
   */
  readonly request: PromiseLike<LanguageModelRequestMetadata>;

  /**
   * 最后一步的附加响应信息。
   *
   * 自动消耗流。
   *
   * @deprecated 请改用`finalStep.response`。
   */
  readonly response: PromiseLike<LanguageModelResponseMetadata>;

  /**
   * 调用期间生成的所有步骤的累积响应消息。
   *
   * 自动消耗流。
   */
  readonly responseMessages: PromiseLike<Array<ResponseMessage>>;

  /**
   * 最后一步中的其他特定于提供商的元数据。
   * 元数据从开始交付到AI SDK，
   * 启用可以完全封装在提供程序中的特定于提供程序的结果。
   *
   * @deprecated 请改用`finalStep.providerMetadata`。
   */
  readonly providerMetadata: PromiseLike<ProviderMetadata | undefined>;

  /**
   * 仅返回生成的文本增量的文本流。你可以使用它
   * 作为 AsyncIterable 或 ReadableStream。当发生错误时，
   * 流会抛出错误。
   */
  readonly textStream: AsyncIterableStream<string>;

  /**
   * 包含所有事件的流，包括文本增量、工具调用、工具结果和
   * 错误。
   * 您可以将其用法 AsyncIterable 或 ReadableStream。
   * 仅抛出停止流的错误，例如网络错误。
   */
  readonly fullStream: AsyncIterableStream<TextStreamPart<TOOLS>>;

  /**
   * 部分输出流。它使用“输出”规范。
   *
   * @deprecated 请改用`partialOutputStream`。
   */
  readonly experimental_partialOutputStream: AsyncIterableStream<
    InferPartialOutput<OUTPUT>
  >;

  /**
   * 部分解析输出的流。它使用“输出”规范。
   */
  readonly partialOutputStream: AsyncIterableStream<InferPartialOutput<OUTPUT>>;

  /**
   * 完成时的各个数组元素的流。
   * 只需在使用`output: Output.array()`时可用。
   */
  readonly elementStream: AsyncIterableStream<InferElementOutput<OUTPUT>>;

  /**
   * 完整的解析输出。它使用“输出”规范。
   */
  readonly output: PromiseLike<InferCompleteOutput<OUTPUT>>;

  /**
   * 消耗流而不处理部件。
   * 这对于强制流完成很有用。
   * 它有效地消除了背压并允许流完成，
   * 触发`onFinish`回调和承诺解析。
   *
   * 如果发生错误，则将其提交给任选的`onError`回调。
   */
  consumeStream(options?: ConsumeStreamOptions): PromiseLike<void>;

  /**
   * 将结果转换为 UI 消息流。
   *
   * @returns UI 消息流。
   */
  toUIMessageStream<UI_MESSAGE extends UIMessage>(
    options?: UIMessageStreamOptions<UI_MESSAGE>,
  ): AsyncIterableStream<InferUIMessageChunk<UI_MESSAGE>>;

  /**
   * 将 UI 消息流输出写入 Node.js 类似响应的对象。
   */
  pipeUIMessageStreamToResponse<UI_MESSAGE extends UIMessage>(
    response: ServerResponse,
    options?: UIMessageStreamResponseInit & UIMessageStreamOptions<UI_MESSAGE>,
  ): void;

  /**
   * 将文本增量输出写入 Node.js 类似响应的对象。
   * 将`Content-Type`标头设置为`text/plain`；字符集=utf-8`和
   * 将每个文本增量写入一个单独的块。
   *
   * @param response 类似 Node.js 响应的对象 (ServerResponse)。
   * @param init 可选标头、状态代码和状态文本。
   */
  pipeTextStreamToResponse(response: ServerResponse, init?: ResponseInit): void;

  /**
   * 将结果转换为带有流数据部分流的流式响应对象。
   *
   * @returns 一个响应对象。
   */
  toUIMessageStreamResponse<UI_MESSAGE extends UIMessage>(
    options?: UIMessageStreamResponseInit & UIMessageStreamOptions<UI_MESSAGE>,
  ): Response;

  /**
   * 创建简单的文本流响应。
   * 每个文本增量都编码为 UTF-8 并作为单独的块发送。
   * 非文本增量事件将被忽略。
   * @param init 可选标头、状态代码和状态文本。
   */
  toTextStreamResponse(init?: ResponseInit): Response;
}

export type TextStreamTextDeltaPart = {
  type: 'text-delta';
  id: string;
  providerMetadata?: ProviderMetadata;
  text: string;
};

export type TextStreamTextStartPart = {
  type: 'text-start';
  id: string;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamTextEndPart = {
  type: 'text-end';
  id: string;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamReasoningStartPart = {
  type: 'reasoning-start';
  id: string;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamReasoningEndPart = {
  type: 'reasoning-end';
  id: string;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamReasoningDeltaPart = {
  type: 'reasoning-delta';
  providerMetadata?: ProviderMetadata;
  id: string;
  text: string;
};

export type TextStreamCustomPart = {
  type: 'custom';
  kind: `${string}.${string}`;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamToolInputStartPart = {
  type: 'tool-input-start';
  id: string;
  toolName: string;
  providerMetadata?: ProviderMetadata;
  toolMetadata?: JSONObject;
  providerExecuted?: boolean;
  dynamic?: boolean;
  title?: string;
};

export type TextStreamToolInputEndPart = {
  type: 'tool-input-end';
  id: string;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamToolInputDeltaPart = {
  type: 'tool-input-delta';
  id: string;
  delta: string;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamSourcePart = { type: 'source' } & Source;

export type TextStreamFilePart = {
  type: 'file';
  file: GeneratedFile;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamReasoningFilePart = {
  type: 'reasoning-file';
  file: GeneratedFile;
  providerMetadata?: ProviderMetadata;
};

export type TextStreamToolCallPart<TOOLS extends ToolSet> = {
  type: 'tool-call';
} & TypedToolCall<TOOLS>;

export type TextStreamToolResultPart<TOOLS extends ToolSet> = {
  type: 'tool-result';
} & TypedToolResult<TOOLS>;

export type TextStreamToolErrorPart<TOOLS extends ToolSet> = {
  type: 'tool-error';
} & TypedToolError<TOOLS>;

export type TextStreamToolOutputDeniedPart<TOOLS extends ToolSet> = {
  type: 'tool-output-denied';
} & StaticToolOutputDenied<TOOLS>;

export type TextStreamToolApprovalRequestPart<TOOLS extends ToolSet> =
  ToolApprovalRequestOutput<TOOLS>;

export type TextStreamToolApprovalResponsePart<TOOLS extends ToolSet> =
  ToolApprovalResponseOutput<TOOLS>;

export type TextStreamStartStepPart = {
  type: 'start-step';
  request: LanguageModelRequestMetadata;
  warnings: CallWarning[];
};

export type TextStreamFinishStepPart = {
  type: 'finish-step';
  response: Omit<LanguageModelResponseMetadata, 'messages' | 'body'>;
  usage: LanguageModelUsage;
  performance: StepResultPerformance;
  finishReason: FinishReason;
  rawFinishReason: string | undefined;
  providerMetadata: ProviderMetadata | undefined;
};

export type TextStreamStartPart = {
  type: 'start';
};

export type TextStreamFinishPart = {
  type: 'finish';
  finishReason: FinishReason;
  rawFinishReason: string | undefined;
  totalUsage: LanguageModelUsage;
};

export type TextStreamAbortPart = {
  type: 'abort';
  reason?: string;
};

export type TextStreamErrorPart = {
  type: 'error';
  error: unknown;
};

export type TextStreamRawPart = {
  type: 'raw';
  rawValue: unknown;
};

export type TextStreamPart<TOOLS extends ToolSet> =
  | TextStreamTextStartPart
  | TextStreamTextEndPart
  | TextStreamTextDeltaPart
  | TextStreamReasoningStartPart
  | TextStreamReasoningEndPart
  | TextStreamReasoningDeltaPart
  | TextStreamCustomPart
  | TextStreamToolInputStartPart
  | TextStreamToolInputEndPart
  | TextStreamToolInputDeltaPart
  | TextStreamSourcePart
  | TextStreamFilePart
  | TextStreamReasoningFilePart
  | TextStreamToolCallPart<TOOLS>
  | TextStreamToolResultPart<TOOLS>
  | TextStreamToolErrorPart<TOOLS>
  | TextStreamToolOutputDeniedPart<TOOLS>
  | TextStreamToolApprovalRequestPart<TOOLS>
  | TextStreamToolApprovalResponsePart<TOOLS>
  | TextStreamStartStepPart
  | TextStreamFinishStepPart
  | TextStreamStartPart
  | TextStreamFinishPart
  | TextStreamAbortPart
  | TextStreamErrorPart
  | TextStreamRawPart;
