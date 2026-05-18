import {
  normalizeHeaders,
  resolve,
  type FetchFunction,
  type Resolvable,
} from '@ai-sdk/provider-utils';
import type { UIMessageChunk } from '../ui-message-stream/ui-message-chunks';
import type { ChatTransport } from './chat-transport';
import type { UIMessage } from './ui-messages';

export type PrepareSendMessagesRequest<UI_MESSAGE extends UIMessage> = (
  options: {
    id: string;
    messages: UI_MESSAGE[];
    requestMetadata: unknown;
    body: Record<string, any> | undefined;
    credentials: RequestCredentials | undefined;
    headers: HeadersInit | undefined;
    api: string;
  } & {
    trigger: 'submit-message' | 'regenerate-message';
    messageId: string | undefined;
  },
) =>
  | {
      body: object;
      headers?: HeadersInit;
      credentials?: RequestCredentials;
      api?: string;
    }
  | PromiseLike<{
      body: object;
      headers?: HeadersInit;
      credentials?: RequestCredentials;
      api?: string;
    }>;

export type PrepareReconnectToStreamRequest = (options: {
  id: string;
  requestMetadata: unknown;
  body: Record<string, any> | undefined;
  credentials: RequestCredentials | undefined;
  headers: HeadersInit | undefined;
  api: string;
}) =>
  | {
      headers?: HeadersInit;
      credentials?: RequestCredentials;
      api?: string;
    }
  | PromiseLike<{
      headers?: HeadersInit;
      credentials?: RequestCredentials;
      api?: string;
    }>;

/**
 * `HttpChatTransport` 类的选项。
 *
 * @param UI_MESSAGE - The type of message to be used in the chat.
 */
export type HttpChatTransportInitOptions<UI_MESSAGE extends UIMessage> = {
  /**
   * 用于聊天传输的 API URL。
   * 默认为“/api/chat”。
   */
  api?: string;

  /**
   * 用于获取请求的凭据模式。
   * 可能的值为：“省略”、“同源”、“包含”。
   * 默认为“同源”。
   */
  credentials?: Resolvable<RequestCredentials>;

  /**
   * 与 API 请求一起发送的 HTTP 标头。
   */
  headers?: Resolvable<Record<string, string> | Headers>;

  /**
   * 与 API 请求一起发送的额外主体对象。
   * @example
   * 将“sessionId”与消息一起发送到 API。
   * ````js
   * 使用聊天（{
   *   正文：{
   *     会话 ID: '123',
   *   }
   * })
   * ```
   */
  body?: Resolvable<object>;

  /**
   * 自定义获取实现。您可以将其用作拦截请求的中间件，
   * 或者提供自定义的获取实现，例如测试。
   */
  fetch?: FetchFunction;

  /**
   * 当提供一个函数时，它将被使用
   * 为聊天 API 准备请求正文。这对于
   * 根据聊天中的消息和数据自定义请求正文。
   */
  prepareSendMessagesRequest?: PrepareSendMessagesRequest<UI_MESSAGE>;

  /**
   * 当提供一个函数时，它将被使用
   * 为聊天 API 准备重新连接请求。这对于
   * 根据聊天会话自定义请求。
   */
  prepareReconnectToStreamRequest?: PrepareReconnectToStreamRequest;
};

export abstract class HttpChatTransport<
  UI_MESSAGE extends UIMessage,
> implements ChatTransport<UI_MESSAGE> {
  protected api: string;
  protected credentials: HttpChatTransportInitOptions<UI_MESSAGE>['credentials'];
  protected headers: HttpChatTransportInitOptions<UI_MESSAGE>['headers'];
  protected body: HttpChatTransportInitOptions<UI_MESSAGE>['body'];
  protected fetch?: FetchFunction;
  protected prepareSendMessagesRequest?: PrepareSendMessagesRequest<UI_MESSAGE>;
  protected prepareReconnectToStreamRequest?: PrepareReconnectToStreamRequest;

  constructor({
    api = '/api/chat',
    credentials,
    headers,
    body,
    fetch,
    prepareSendMessagesRequest,
    prepareReconnectToStreamRequest,
  }: HttpChatTransportInitOptions<UI_MESSAGE>) {
    this.api = api;
    this.credentials = credentials;
    this.headers = headers;
    this.body = body;
    this.fetch = fetch;
    this.prepareSendMessagesRequest = prepareSendMessagesRequest;
    this.prepareReconnectToStreamRequest = prepareReconnectToStreamRequest;
  }

  async sendMessages({
    abortSignal,
    ...options
  }: Parameters<ChatTransport<UI_MESSAGE>['sendMessages']>[0]) {
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);
    const resolvedCredentials = await resolve(this.credentials);

    const baseHeaders = {
      ...normalizeHeaders(resolvedHeaders),
      ...normalizeHeaders(options.headers),
    };

    const preparedRequest = await this.prepareSendMessagesRequest?.({
      api: this.api,
      id: options.chatId,
      messages: options.messages,
      body: { ...resolvedBody, ...options.body },
      headers: baseHeaders,
      credentials: resolvedCredentials,
      requestMetadata: options.metadata,
      trigger: options.trigger,
      messageId: options.messageId,
    });

    const api = preparedRequest?.api ?? this.api;
    const headers =
      preparedRequest?.headers !== undefined
        ? normalizeHeaders(preparedRequest.headers)
        : baseHeaders;
    const body =
      preparedRequest?.body !== undefined
        ? preparedRequest.body
        : {
            ...resolvedBody,
            ...options.body,
            id: options.chatId,
            messages: options.messages,
            trigger: options.trigger,
            messageId: options.messageId,
          };
    const credentials = preparedRequest?.credentials ?? resolvedCredentials;

    // 避免缓存 globalThis.fetch，以防它被其他库修补
    const fetch = this.fetch ?? globalThis.fetch;

    const response = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      credentials,
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(
        (await response.text()) ?? 'Failed to fetch the chat response.',
      );
    }

    if (!response.body) {
      throw new Error('The response body is empty.');
    }

    return this.processResponseStream(response.body);
  }

  async reconnectToStream(
    options: Parameters<ChatTransport<UI_MESSAGE>['reconnectToStream']>[0],
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    const resolvedBody = await resolve(this.body);
    const resolvedHeaders = await resolve(this.headers);
    const resolvedCredentials = await resolve(this.credentials);

    const baseHeaders = {
      ...normalizeHeaders(resolvedHeaders),
      ...normalizeHeaders(options.headers),
    };

    const preparedRequest = await this.prepareReconnectToStreamRequest?.({
      api: this.api,
      id: options.chatId,
      body: { ...resolvedBody, ...options.body },
      headers: baseHeaders,
      credentials: resolvedCredentials,
      requestMetadata: options.metadata,
    });

    const api = preparedRequest?.api ?? `${this.api}/${options.chatId}/stream`;
    const headers =
      preparedRequest?.headers !== undefined
        ? normalizeHeaders(preparedRequest.headers)
        : baseHeaders;
    const credentials = preparedRequest?.credentials ?? resolvedCredentials;

    // 避免缓存 globalThis.fetch，以防它被其他库修补
    const fetch = this.fetch ?? globalThis.fetch;

    const response = await fetch(api, {
      method: 'GET',
      headers,
      credentials,
    });

    // 未找到活动流，因此我们不恢复
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        (await response.text()) ?? 'Failed to fetch the chat response.',
      );
    }

    if (!response.body) {
      throw new Error('The response body is empty.');
    }

    return this.processResponseStream(response.body);
  }

  protected abstract processResponseStream(
    stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
  ): ReadableStream<UIMessageChunk>;
}
