import {
  InvalidResponseDataError,
  type LanguageModelV4StreamPart,
  type SharedV4ProviderMetadata,
} from '@ai-sdk/provider';
import { generateId as defaultGenerateId } from './generate-id';
import { isParsableJson } from './parse-json';

/**
 * 流媒体工具从兼容 OpenAI 的 API 调用 delta 的最小接口。
 */
export interface StreamingToolCallDelta {
  index?: number | null;
  id?: string | null;
  type?: string | null;
  function?: {
    name?: string | null;
    arguments?: string | null;
  } | null;
}

export interface StreamingToolCallTrackerOptions<
  DELTA extends StreamingToolCallDelta = StreamingToolCallDelta,
> {
  /**
   * 用于工具调用 ID 的 ID 生成器函数。
   * 默认为标准的generateId。
   */
  generateId?: () => string;

  /**
   * 如何验证新工具调用增量上的“类型”字段。
   * - `'none'`：不验证（默认）
   * - `'if-present'`：如果类型存在而不是`'function'`则抛出异常
   * - “required”：如果类型不完全是“function”，则抛出异常
   */
  typeValidation?: 'none' | 'if-present' | 'required';

  /**
   * 从工具调用增量中提取特定于提供者的元数据。
   * 当检测到新的工具调用时调用一次。
   * 返回的元数据存储在工具调用中并传递给
   * 工具调用完成时的“buildToolCallProviderMetadata”。
   */
  extractMetadata?: (delta: DELTA) => SharedV4ProviderMetadata | undefined;

  /**
   * 为“工具调用”事件构建“providerMetadata”对象。
   * 接收之前通过“extractMetadata”提取的元数据。
   * 如果返回“undefined”，则事件中不包含“providerMetadata”。
   */
  buildToolCallProviderMetadata?: (
    metadata: SharedV4ProviderMetadata | undefined,
  ) => SharedV4ProviderMetadata | undefined;
}

interface TrackedToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
  hasFinished: boolean;
  metadata?: SharedV4ProviderMetadata;
}

type StreamingToolCallTrackerController = Pick<
  TransformStreamDefaultController<LanguageModelV4StreamPart>,
  'enqueue'
>;

/**
 * 跟踪跨多个增量的流工具调用状态
 * 兼容 OpenAI 的聊天完成流。处理参数积累，
 * 发出工具输入开始/增量/结束和工具调用事件，并完成
 * 未完成的工具调用刷新。
 *
 * 由 openai、openai 兼容、groq、deepseek 和阿里巴巴提供商使用。
 */
export class StreamingToolCallTracker<
  DELTA extends StreamingToolCallDelta = StreamingToolCallDelta,
> {
  private toolCalls: TrackedToolCall[] = [];
  private readonly controller: StreamingToolCallTrackerController;
  private readonly _generateId: () => string;
  private readonly typeValidation: 'none' | 'if-present' | 'required';
  private readonly extractMetadata?: (
    delta: DELTA,
  ) => SharedV4ProviderMetadata | undefined;
  private readonly buildToolCallProviderMetadata?: (
    metadata: SharedV4ProviderMetadata | undefined,
  ) => SharedV4ProviderMetadata | undefined;

  constructor(
    controller: StreamingToolCallTrackerController,
    options: StreamingToolCallTrackerOptions<DELTA> = {},
  ) {
    this.controller = controller;
    this._generateId = options.generateId ?? defaultGenerateId;
    this.typeValidation = options.typeValidation ?? 'none';
    this.extractMetadata = options.extractMetadata;
    this.buildToolCallProviderMetadata = options.buildToolCallProviderMetadata;
  }

  /**
   * 处理来自流响应块的工具调用增量。
   * 发出工具输入开始、工具输入增量、工具输入结束和工具调用
   * 适当的事件。
   */
  processDelta(toolCallDelta: DELTA): void {
    const index = toolCallDelta.index ?? this.toolCalls.length;

    if (this.toolCalls[index] == null) {
      this.processNewToolCall(index, toolCallDelta);
    } else {
      this.processExistingToolCall(index, toolCallDelta);
    }
  }

  /**
   * 完成所有未完成的工具调用。应该在流期间调用
   * 刷新处理程序以确保所有工具调用均正确完成。
   */
  flush(): void {
    for (const toolCall of this.toolCalls) {
      if (!toolCall.hasFinished) {
        this.finishToolCall(toolCall);
      }
    }
  }

  private processNewToolCall(index: number, toolCallDelta: DELTA): void {
    if (this.typeValidation === 'required') {
      if (toolCallDelta.type !== 'function') {
        throw new InvalidResponseDataError({
          data: toolCallDelta,
          message: `Expected 'function' type.`,
        });
      }
    } else if (this.typeValidation === 'if-present') {
      if (toolCallDelta.type != null && toolCallDelta.type !== 'function') {
        throw new InvalidResponseDataError({
          data: toolCallDelta,
          message: `Expected 'function' type.`,
        });
      }
    }

    if (toolCallDelta.id == null) {
      throw new InvalidResponseDataError({
        data: toolCallDelta,
        message: `Expected 'id' to be a string.`,
      });
    }

    if (toolCallDelta.function?.name == null) {
      throw new InvalidResponseDataError({
        data: toolCallDelta,
        message: `Expected 'function.name' to be a string.`,
      });
    }

    this.controller.enqueue({
      type: 'tool-input-start',
      id: toolCallDelta.id,
      toolName: toolCallDelta.function.name,
    });

    const metadata = this.extractMetadata?.(toolCallDelta);

    this.toolCalls[index] = {
      id: toolCallDelta.id,
      type: 'function',
      function: {
        name: toolCallDelta.function.name,
        arguments: toolCallDelta.function.arguments ?? '',
      },
      hasFinished: false,
      metadata,
    };

    const toolCall = this.toolCalls[index];

    // 如果参数已存在，则发出初始增量
    if (toolCall.function.arguments.length > 0) {
      this.controller.enqueue({
        type: 'tool-input-delta',
        id: toolCall.id,
        delta: toolCall.function.arguments,
      });
    }

    // 检查工具调用是否完成
    // （一些提供商以一大块形式发送完整的工具调用）
    if (isParsableJson(toolCall.function.arguments)) {
      this.finishToolCall(toolCall);
    }
  }

  private processExistingToolCall(index: number, toolCallDelta: DELTA): void {
    const toolCall = this.toolCalls[index];

    if (toolCall.hasFinished) {
      return;
    }

    if (toolCallDelta.function?.arguments != null) {
      toolCall.function.arguments += toolCallDelta.function.arguments;

      this.controller.enqueue({
        type: 'tool-input-delta',
        id: toolCall.id,
        delta: toolCallDelta.function.arguments,
      });
    }

    // 检查工具调用是否完成
    if (isParsableJson(toolCall.function.arguments)) {
      this.finishToolCall(toolCall);
    }
  }

  private finishToolCall(toolCall: TrackedToolCall): void {
    this.controller.enqueue({
      type: 'tool-input-end',
      id: toolCall.id,
    });

    const providerMetadata = this.buildToolCallProviderMetadata?.(
      toolCall.metadata,
    );

    this.controller.enqueue({
      type: 'tool-call',
      toolCallId: toolCall.id ?? this._generateId(),
      toolName: toolCall.function.name,
      input: toolCall.function.arguments,
      ...(providerMetadata ? { providerMetadata } : {}),
    });

    toolCall.hasFinished = true;
  }
}
