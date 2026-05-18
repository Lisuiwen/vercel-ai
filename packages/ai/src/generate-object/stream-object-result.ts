import type { ServerResponse } from 'http';
import type { AsyncIterableStream } from '../util/async-iterable-stream';
import type {
  CallWarning,
  FinishReason,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata,
  ProviderMetadata,
} from '../types';
import type { LanguageModelUsage } from '../types/usage';

/**
 * `streamObject`调用的结果，包含部分对象流和附加信息。
 */
export interface StreamObjectResult<PARTIAL, RESULT, ELEMENT_STREAM> {
  /**
   * 来自模型提供商的警告（例如不支持的设置）
   */
  readonly warnings: Promise<CallWarning[] | undefined>;

  /**
   * 生成的响应的令牌使用情况。响应完成后解决。
   */
  readonly usage: Promise<LanguageModelUsage>;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从成功到AI SDK并实现成功特定的
   * 可以完全封装在提供者中的结果。
   */
  readonly providerMetadata: Promise<ProviderMetadata | undefined>;

  /**
   * 上一步中的附加请求信息。
   */
  readonly request: Promise<Omit<LanguageModelRequestMetadata, 'messages'>>;

  /**
   * 附加响应信息。
   */
  readonly response: Promise<Omit<LanguageModelResponseMetadata, 'messages'>>;

  /**
   * 一代完结的原因。取自最后一步。
   *
   * 响应完成后解决。
   */
  readonly finishReason: Promise<FinishReason>;

  /**
   * 生成的对象（根据模式键入）。响应完成后解决。
   */
  readonly object: Promise<RESULT>;

  /**
   * 部分对象流。随着流的进展，它会变得更加完整。
   *
   * 请注意，部分对象未经过验证。
   * 如果您想确定实际内容与您的架构匹配，您需要对部分结果实施自己的验证。
   */
  readonly partialObjectStream: AsyncIterableStream<PARTIAL>;

  /**
   * 流过完整的数组元素。仅当输出策略设置为“数组”时才可用。
   */
  readonly elementStream: ELEMENT_STREAM;

  /**
   * 生成的对象的 JSON 表示形式的文本流。它包含文本块。
   * 当流完成时，对象是可以解析的有效JSON。
   */
  readonly textStream: AsyncIterableStream<string>;

  /**
   * 不同类型事件的流，包括部分对象、错误和完成事件。
   * 仅抛出停止流的错误，例如网络错误。
   */
  readonly fullStream: AsyncIterableStream<ObjectStreamPart<PARTIAL>>;

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
   * 创建简单的文本流响应。
   * 响应的`Content-Type`标头设置为`text/plain`；字符集=utf-8`。
   * 每个文本增量都编码为 UTF-8 并作为单独的块发送。
   * 非文本增量事件将被忽略。
   *
   * @param init 可选标头、状态代码和状态文本。
   */
  toTextStreamResponse(init?: ResponseInit): Response;
}

export type ObjectStreamPart<PARTIAL> =
  | {
      type: 'object';
      object: PARTIAL;
    }
  | {
      type: 'text-delta';
      textDelta: string;
    }
  | {
      type: 'error';
      error: unknown;
    }
  | {
      type: 'finish';
      finishReason: FinishReason;
      usage: LanguageModelUsage;
      response: Omit<LanguageModelResponseMetadata, 'messages'>;
      providerMetadata?: ProviderMetadata;
    };
