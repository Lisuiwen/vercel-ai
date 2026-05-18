import {
  generateId as generateIdFunc,
  type FlexibleSchema,
  type IdGenerator,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import type { FinishReason } from '../types/language-model';
import type { UIMessageChunk } from '../ui-message-stream/ui-message-chunks';
import { consumeStream } from '../util/consume-stream';
import { SerialJobExecutor } from '../util/serial-job-executor';
import type { ChatTransport } from './chat-transport';
import { convertFileListToFileUIParts } from './convert-file-list-to-file-ui-parts';
import { DefaultChatTransport } from './default-chat-transport';
import {
  createStreamingUIMessageState,
  processUIMessageStream,
  type StreamingUIMessageState,
} from './process-ui-message-stream';
import {
  isToolUIPart,
  type DataUIPart,
  type FileUIPart,
  type InferUIMessageData,
  type InferUIMessageMetadata,
  type InferUIMessageTools,
  type UIDataTypes,
  type UIMessage,
  type InferUIMessageToolCall,
  type UIMessagePart,
  type UITools,
} from './ui-messages';
export type CreateUIMessage<UI_MESSAGE extends UIMessage> = Omit<
  UI_MESSAGE,
  'id' | 'role'
> & {
  id?: UI_MESSAGE['id'];
  role?: UI_MESSAGE['role'];
};

export type UIDataPartSchemas = Record<string, FlexibleSchema>;

export type UIDataTypesToSchemas<T extends UIDataTypes> = {
  [K in keyof T]: FlexibleSchema<T[K]>;
};

export type InferUIDataParts<T extends UIDataPartSchemas> = {
  [K in keyof T]: InferSchema<T[K]>;
};

export type ChatRequestOptions = {
  /**
   * 应提交到 API 端点的附加标头。
   */
  headers?: Record<string, string> | Headers;

  /**
   * 应发送 API 端点的其他正文 JSON 属性。
   */
  body?: object; // TODO JSONStringify

  metadata?: unknown;
};

/**
 * 可以调用该函数将工具批准响应添加到聊天中。
 */
export type ChatAddToolApproveResponseFunction = ({
  id,
  approved,
  reason,
  options,
}: {
  id: string;

  /**
   * 指示批准是被授予还是被拒绝的标志。
   */
  approved: boolean;

  /**
   * 批准或拒绝的可选原因。
   */
  reason?: string;

  /**
   * 如果 `sendAutomaticallyWhen` 回调返回 true，则使用可选的请求选项。
   */
  options?: ChatRequestOptions;
}) => void | PromiseLike<void>;

/**
 * 可以调用该函数将工具输出添加到聊天中。
 */
export type ChatAddToolOutputFunction<UI_MESSAGE extends UIMessage> = <
  TOOL extends keyof InferUIMessageTools<UI_MESSAGE>,
>({
  state,
  tool,
  toolCallId,
  output,
  errorText,
  options,
}: {
  /**
   * 调用的工具的名称。
   */
  tool: TOOL;

  /**
   * 要为其添加输出的工具调用的标识符。
   */
  toolCallId: string;

  /**
   * 如果 `sendAutomaticallyWhen` 回调返回 true，则使用可选的请求选项。
   */
  options?: ChatRequestOptions;
} & (
  | {
      state?: 'output-available';
      output: InferUIMessageTools<UI_MESSAGE>[TOOL]['output'];
      errorText?: never;
    }
  | {
      state: 'output-error';
      output?: never;
      errorText: string;
    }
)) => void | PromiseLike<void>;

export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

type ActiveResponse<UI_MESSAGE extends UIMessage> = {
  state: StreamingUIMessageState<UI_MESSAGE>;
  abortController: AbortController;
};

export interface ChatState<UI_MESSAGE extends UIMessage> {
  status: ChatStatus;

  error: Error | undefined;

  messages: UI_MESSAGE[];
  pushMessage: (message: UI_MESSAGE) => void;
  popMessage: () => void;
  replaceMessage: (index: number, message: UI_MESSAGE) => void;

  snapshot: <T>(thing: T) => T;
}

export type ChatOnErrorCallback = (error: Error) => void;

export type ChatOnToolCallCallback<UI_MESSAGE extends UIMessage = UIMessage> =
  (options: {
    toolCall: InferUIMessageToolCall<UI_MESSAGE>;
  }) => void | PromiseLike<void>;

export type ChatOnDataCallback<UI_MESSAGE extends UIMessage> = (
  dataPart: DataUIPart<InferUIMessageData<UI_MESSAGE>>,
) => void;

/**
 * 当助理响应完成流式传输时调用的函数。
 *
 * @param message 流式传输的助理消息。
 * @param messages 完整的聊天历史记录，包括助理消息。
 *
 * @param isAbort 指示请求是否已中止。
 * @param isDisconnect 指示请求是否因网络错误而结束。
 * @param isError 指示请求是否因错误而结束。
 * @param finishReason 生成完成的原因。
 */
export type ChatOnFinishCallback<UI_MESSAGE extends UIMessage> = (options: {
  message: UI_MESSAGE;
  messages: UI_MESSAGE[];
  isAbort: boolean;
  isDisconnect: boolean;
  isError: boolean;
  finishReason?: FinishReason;
}) => void;

export interface ChatInit<UI_MESSAGE extends UIMessage> {
  /**
   * 聊天的唯一标识符。如果没有提供，将随机提供一个
   * 生成的。
   */
  id?: string;

  messageMetadataSchema?: FlexibleSchema<InferUIMessageMetadata<UI_MESSAGE>>;
  dataPartSchemas?: UIDataTypesToSchemas<InferUIMessageData<UI_MESSAGE>>;

  messages?: UI_MESSAGE[];

  /**
   * 一种提供用于消息和聊天 ID 的函数的方法。
   * 如果未提供，则使用默认的AI SDK `generateId`。
   */
  generateId?: IdGenerator;

  transport?: ChatTransport<UI_MESSAGE>;

  /**
   * 遇到错误时调用的回调函数。
   */
  onError?: ChatOnErrorCallback;

  /**
   * 收到工具调用时调用的可选回调函数。
   * 用于自动执行客户端工具。
   *
   * 您可以选择返回工具调用的结果，
   * 同步或异步。
   */
  onToolCall?: ChatOnToolCallCallback<UI_MESSAGE>;

  /**
   * 当助理响应完成流式传输时调用的函数。
   */
  onFinish?: ChatOnFinishCallback<UI_MESSAGE>;

  /**
   * 接收到数据部分时调用的可选回调函数。
   *
   * @param data 接收到的数据部分。
   */
  onData?: ChatOnDataCallback<UI_MESSAGE>;

  /**
   * 如果提供，将在流完成或添加工具调用时调用此函数
   * 以确定是否应重新提交当前消息。
   */
  sendAutomaticallyWhen?: (options: {
    messages: UI_MESSAGE[];
  }) => boolean | PromiseLike<boolean>;
}

export abstract class AbstractChat<UI_MESSAGE extends UIMessage> {
  readonly id: string;
  readonly generateId: IdGenerator;

  protected state: ChatState<UI_MESSAGE>;

  private messageMetadataSchema:
    | FlexibleSchema<InferUIMessageMetadata<UI_MESSAGE>>
    | undefined;
  private dataPartSchemas:
    | UIDataTypesToSchemas<InferUIMessageData<UI_MESSAGE>>
    | undefined;
  private readonly transport: ChatTransport<UI_MESSAGE>;
  private onError?: ChatInit<UI_MESSAGE>['onError'];
  private onToolCall?: ChatInit<UI_MESSAGE>['onToolCall'];
  private onFinish?: ChatInit<UI_MESSAGE>['onFinish'];
  private onData?: ChatInit<UI_MESSAGE>['onData'];
  private sendAutomaticallyWhen?: ChatInit<UI_MESSAGE>['sendAutomaticallyWhen'];

  private activeResponse: ActiveResponse<UI_MESSAGE> | undefined = undefined;
  private jobExecutor = new SerialJobExecutor();

  constructor({
    generateId = generateIdFunc,
    id = generateId(),
    transport = new DefaultChatTransport(),
    messageMetadataSchema,
    dataPartSchemas,
    state,
    onError,
    onToolCall,
    onFinish,
    onData,
    sendAutomaticallyWhen,
  }: Omit<ChatInit<UI_MESSAGE>, 'messages'> & {
    state: ChatState<UI_MESSAGE>;
  }) {
    this.id = id;
    this.transport = transport;
    this.generateId = generateId;
    this.messageMetadataSchema = messageMetadataSchema;
    this.dataPartSchemas = dataPartSchemas;
    this.state = state;
    this.onError = onError;
    this.onToolCall = onToolCall;
    this.onFinish = onFinish;
    this.onData = onData;
    this.sendAutomaticallyWhen = sendAutomaticallyWhen;
  }

  /**
   * 挂钩状态：
   *
   * - `已提交`：消息已发送到API，我们正在等待响应流的开始。
   * - `streaming`：响应主动从API流入，接收数据块。
   * - `ready`：已收到并处理完整的响应；可以提交新的用户消息。
   * - `error`：API请求期间发生错误，导致无法完成成功。
   */
  get status(): ChatStatus {
    return this.state.status;
  }

  protected setStatus({
    status,
    error,
  }: {
    status: ChatStatus;
    error?: Error;
  }) {
    if (this.status === status) return;

    this.state.status = status;
    this.state.error = error;
  }

  get error() {
    return this.state.error;
  }

  get messages(): UI_MESSAGE[] {
    return this.state.messages;
  }

  get lastMessage(): UI_MESSAGE | undefined {
    return this.state.messages[this.state.messages.length - 1];
  }

  set messages(messages: UI_MESSAGE[]) {
    this.state.messages = messages;
  }

  /**
   * 将消息用户添加或替换到聊天列表。这会触发 API 调用来获取
   * 助理的回应。
   *
   * 如果提供了messageId，则消息将被替换。
   */
  sendMessage = async (
    message?:
      | (CreateUIMessage<UI_MESSAGE> & {
          text?: never;
          files?: never;
          messageId?: string;
        })
      | {
          text: string;
          files?: FileList | FileUIPart[];
          metadata?: InferUIMessageMetadata<UI_MESSAGE>;
          parts?: never;
          messageId?: string;
        }
      | {
          files: FileList | FileUIPart[];
          metadata?: InferUIMessageMetadata<UI_MESSAGE>;
          parts?: never;
          messageId?: string;
        },
    options?: ChatRequestOptions,
  ): Promise<void> => {
    if (message == null) {
      await this.makeRequest({
        trigger: 'submit-message',
        messageId: this.lastMessage?.id,
        ...options,
      });
      return;
    }

    let uiMessage: CreateUIMessage<UI_MESSAGE>;

    if ('text' in message || 'files' in message) {
      const fileParts = Array.isArray(message.files)
        ? message.files
        : await convertFileListToFileUIParts(message.files);

      uiMessage = {
        parts: [
          ...fileParts,
          ...('text' in message && message.text != null
            ? [{ type: 'text' as const, text: message.text }]
            : []),
        ],
      } as UI_MESSAGE;
    } else {
      uiMessage = message;
    }

    if (message.messageId != null) {
      const messageIndex = this.state.messages.findIndex(
        m => m.id === message.messageId,
      );

      if (messageIndex === -1) {
        throw new Error(`message with id ${message.messageId} not found`);
      }

      if (this.state.messages[messageIndex].role !== 'user') {
        throw new Error(
          `message with id ${message.messageId} is not a user message`,
        );
      }

      // 删除给定id的消息之后的所有消息
      this.state.messages = this.state.messages.slice(0, messageIndex + 1);

      // 使用新内容更新消息
      this.state.replaceMessage(messageIndex, {
        ...uiMessage,
        id: message.messageId,
        role: uiMessage.role ?? 'user',
        metadata: message.metadata,
      } as UI_MESSAGE);
    } else {
      this.state.pushMessage({
        ...uiMessage,
        id: uiMessage.id ?? this.generateId(),
        role: uiMessage.role ?? 'user',
        metadata: message.metadata,
      } as UI_MESSAGE);
    }

    await this.makeRequest({
      trigger: 'submit-message',
      messageId: message.messageId,
      ...options,
    });
  };

  /**
   * 使用提供的消息ID重新生成助手消息。
   * 如果未提供消息ID，则将重新生成最后一条助手消息。
   */
  regenerate = async ({
    messageId,
    ...options
  }: {
    messageId?: string;
  } & ChatRequestOptions = {}): Promise<void> => {
    const messageIndex =
      messageId == null
        ? this.state.messages.length - 1
        : this.state.messages.findIndex(message => message.id === messageId);

    if (messageIndex === -1) {
      throw new Error(`message ${messageId} not found`);
    }

    // 将消息设置为助理消息之前的消息
    this.state.messages = this.state.messages.slice(
      0,
      // 如果消息是用户消息，我们需要将其包含在请求中：
      this.messages[messageIndex].role === 'assistant'
        ? messageIndex
        : messageIndex + 1,
    );

    await this.makeRequest({
      trigger: 'regenerate-message',
      messageId,
      ...options,
    });
  };

  /**
   * 尝试恢复正在进行的流响应。
   */
  resumeStream = async (options: ChatRequestOptions = {}): Promise<void> => {
    await this.makeRequest({ trigger: 'resume-stream', ...options });
  };

  /**
   * 如果聊天处于错误状态，则清除错误状态并将状态设置为就绪。
   */
  clearError = () => {
    if (this.status === 'error') {
      this.state.error = undefined;
      this.setStatus({ status: 'ready' });
    }
  };

  addToolApprovalResponse: ChatAddToolApproveResponseFunction = async ({
    id,
    approved,
    reason,
    options,
  }) =>
    this.jobExecutor.run(async () => {
      const messages = this.state.messages;
      const lastMessage = messages[messages.length - 1];

      const updatePart = (
        part: UIMessagePart<UIDataTypes, UITools>,
      ): UIMessagePart<UIDataTypes, UITools> =>
        isToolUIPart(part) &&
        part.state === 'approval-requested' &&
        part.approval.id === id
          ? {
              ...part,
              state: 'approval-responded',
              approval: { id, approved, reason },
            }
          : part;

      // 更新消息以触发立即 UI 更新
      this.state.replaceMessage(messages.length - 1, {
        ...lastMessage,
        parts: lastMessage.parts.map(updatePart),
      });

      // 更新活动响应（如果存在）
      if (this.activeResponse) {
        this.activeResponse.state.message.parts =
          this.activeResponse.state.message.parts.map(updatePart);
      }

      // 如果sendAutomaticallyWhen函数返回true，则自动发送消息
      if (
        this.status !== 'streaming' &&
        this.status !== 'submitted' &&
        this.sendAutomaticallyWhen
      ) {
        this.shouldSendAutomatically().then(shouldSend => {
          if (shouldSend) {
            // 无需等待以避免死锁
            this.makeRequest({
              trigger: 'submit-message',
              messageId: this.lastMessage?.id,
              ...options,
            });
          }
        });
      }
    });

  addToolOutput: ChatAddToolOutputFunction<UI_MESSAGE> = async ({
    state = 'output-available',
    toolCallId,
    output,
    errorText,
    options,
  }) =>
    this.jobExecutor.run(async () => {
      const messages = this.state.messages;
      const lastMessage = messages[messages.length - 1];

      const updatePart = (
        part: UIMessagePart<UIDataTypes, UITools>,
      ): UIMessagePart<UIDataTypes, UITools> =>
        isToolUIPart(part) && part.toolCallId === toolCallId
          ? ({ ...part, state, output, errorText } as typeof part)
          : part;

      // 更新消息以触发立即 UI 更新
      this.state.replaceMessage(messages.length - 1, {
        ...lastMessage,
        parts: lastMessage.parts.map(updatePart),
      });

      // 更新活动响应（如果存在）
      if (this.activeResponse) {
        this.activeResponse.state.message.parts =
          this.activeResponse.state.message.parts.map(updatePart);
      }

      // 如果sendAutomaticallyWhen函数返回true，则自动发送消息
      if (
        this.status !== 'streaming' &&
        this.status !== 'submitted' &&
        this.sendAutomaticallyWhen
      ) {
        this.shouldSendAutomatically().then(shouldSend => {
          if (shouldSend) {
            // 无需等待以避免死锁
            this.makeRequest({
              trigger: 'submit-message',
              messageId: this.lastMessage?.id,
              ...options,
            });
          }
        });
      }
    });

  /* * @deprecated 使用 addToolOutput */
  addToolResult = this.addToolOutput;

  /**
   * 立即中止当前请求，如果有生成的令牌则保留。
   */
  stop = async () => {
    if (this.status !== 'streaming' && this.status !== 'submitted') return;

    if (this.activeResponse?.abortController) {
      this.activeResponse.abortController.abort();
    }
  };

  private async shouldSendAutomatically(): Promise<boolean> {
    if (!this.sendAutomaticallyWhen) return false;

    const result = this.sendAutomaticallyWhen({
      messages: this.state.messages,
    });

    // 检查结果是否是承诺
    if (result && typeof result === 'object' && 'then' in result) {
      return await result;
    }

    return result as boolean;
  }

  private async makeRequest({
    trigger,
    metadata,
    headers,
    body,
    messageId,
  }: {
    trigger: 'submit-message' | 'resume-stream' | 'regenerate-message';
    messageId?: string;
  } & ChatRequestOptions) {
    // 对于恢复流，检查之前是否有活动流
    // 改变状态。这可以避免“已提交”状态的短暂闪烁
    // 当没有要恢复的流时（例如，在页面加载时）。
    let resumeStream: ReadableStream<UIMessageChunk> | undefined;
    if (trigger === 'resume-stream') {
      try {
        const reconnect = await this.transport.reconnectToStream({
          chatId: this.id,
          metadata,
          headers,
          body,
        });

        if (reconnect == null) {
          return; // 未找到活动流，因此我们不恢复
        }

        resumeStream = reconnect;
      } catch (err) {
        if (this.onError && err instanceof Error) {
          this.onError(err);
        }
        this.setStatus({ status: 'error', error: err as Error });
        return;
      }
    }

    this.setStatus({ status: 'submitted', error: undefined });

    const lastMessage = this.lastMessage;

    let isAbort = false;
    let isDisconnect = false;
    let isError = false;

    try {
      const activeResponse = {
        state: createStreamingUIMessageState({
          lastMessage: this.state.snapshot(lastMessage),
          messageId: this.generateId(),
        }),
        abortController: new AbortController(),
      } as ActiveResponse<UI_MESSAGE>;

      activeResponse.abortController.signal.addEventListener('abort', () => {
        isAbort = true;
      });

      this.activeResponse = activeResponse;

      let stream: ReadableStream<UIMessageChunk>;

      if (trigger === 'resume-stream') {
        stream = resumeStream!;
      } else {
        stream = await this.transport.sendMessages({
          chatId: this.id,
          messages: this.state.messages,
          abortSignal: activeResponse.abortController.signal,
          metadata,
          headers,
          body,
          trigger,
          messageId,
        });
      }

      const runUpdateMessageJob = (
        job: (options: {
          state: StreamingUIMessageState<UI_MESSAGE>;
          write: () => void;
        }) => Promise<void>,
      ) =>
        // 序列化作业执行以避免竞争条件：
        this.jobExecutor.run(() =>
          job({
            state: activeResponse.state,
            write: () => {
              // 流式传输在第一次写入时设置（在“提交”之前）
              this.setStatus({ status: 'streaming' });

              const replaceLastMessage =
                activeResponse.state.message.id === this.lastMessage?.id;

              if (replaceLastMessage) {
                this.state.replaceMessage(
                  this.state.messages.length - 1,
                  activeResponse.state.message,
                );
              } else {
                this.state.pushMessage(activeResponse.state.message);
              }
            },
          }),
        );

      await consumeStream({
        stream: processUIMessageStream({
          stream,
          onToolCall: this.onToolCall,
          onData: this.onData,
          messageMetadataSchema: this.messageMetadataSchema,
          dataPartSchemas: this.dataPartSchemas,
          runUpdateMessageJob,
          onError: error => {
            throw error;
          },
        }),
        onError: error => {
          throw error;
        },
      });

      this.setStatus({ status: 'ready' });
    } catch (err) {
      // 忽略预期的中止错误。
      if (isAbort || (err as any).name === 'AbortError') {
        isAbort = true;
        this.setStatus({ status: 'ready' });
        return null;
      }

      isError = true;

      // 网络错误，如断线、超时等。
      if (
        err instanceof TypeError &&
        (err.message.toLowerCase().includes('fetch') ||
          err.message.toLowerCase().includes('network'))
      ) {
        isDisconnect = true;
      }

      if (this.onError && err instanceof Error) {
        this.onError(err);
      }

      this.setStatus({ status: 'error', error: err as Error });
    } finally {
      try {
        this.onFinish?.({
          message: this.activeResponse!.state.message,
          messages: this.state.messages,
          isAbort,
          isDisconnect,
          isError,
          finishReason: this.activeResponse?.state.finishReason,
        });
      } catch (err) {
        console.error(err);
      }

      this.activeResponse = undefined;
    }

    // 如果sendAutomaticallyWhen函数返回true，则自动发送消息
    if (!isError && (await this.shouldSendAutomatically())) {
      await this.makeRequest({
        trigger: 'submit-message',
        messageId: this.lastMessage?.id,
        metadata,
        headers,
        body,
      });
    }
  }
}
