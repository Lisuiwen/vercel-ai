import type { ProviderOptions } from '@ai-sdk/provider-utils';
import type { Embedding, ProviderMetadata } from '../types';
import type { EmbeddingModelUsage } from '../types/usage';
import type { Warning } from '../types/warning';

/**
 * 事件传递给 embed 和 embedMany 操作的`onStart`回调。
 *
 * 在操作开始时、调用嵌入模型之前调用。
 */
export type EmbedStartEvent = {
  /* * 此嵌入调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 操作标识类型（例如`ai.embed`或`ai.embedMany`）。 */
  readonly operationId: string;

  /* * 提供者标识符（例如`openai`、`anthropic`）。 */
  readonly provider: string;

  /* * 特定模型标识符（例如`text-embedding-3-small`）。 */
  readonly modelId: string;

  /* * 嵌入的值。用于嵌入的字符串，用于嵌入Many的数据库。 */
  readonly value: string | Array<string>;

  /* * 失败请求的最大重试次数。 */
  readonly maxRetries: number;

  /* * 随请求一起发送的附加 HTTP 标头。 */
  readonly headers: Record<string, string | undefined> | undefined;

  /* * 其他特定于提供商的选项。 */
  readonly providerOptions: ProviderOptions | undefined;
};

/**
 * 事件传递给`experimental_onEnd`回调以执行 embed 和 embedMany 操作。
 *
 * 操作完成时、嵌入模型返回后调用。
 */
export type EmbedEndEvent = {
  /* * 此嵌入调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 操作标识类型（例如`ai.embed`或`ai.embedMany`）。 */
  readonly operationId: string;

  /* * 提供者标识符（例如`openai`、`anthropic`）。 */
  readonly provider: string;

  /* * 特定模型标识符（例如`text-embedding-3-small`）。 */
  readonly modelId: string;

  /* * 嵌入的值。用于嵌入的字符串，用于嵌入Many的数据库。 */
  readonly value: string | Array<string>;

  /* * 生成的嵌入。一个用于嵌入的单个管理，一个用于嵌入多个的集群。 */
  readonly embedding: Embedding | Array<Embedding>;

  /* * 嵌入操作的令牌使用情况。 */
  readonly usage: EmbeddingModelUsage;

  /* * 来自嵌入模型的警告，例如不支持的设置。 */
  readonly warnings: Array<Warning>;

  /* * 可选的特定于提供商的元数据。 */
  readonly providerMetadata: ProviderMetadata | undefined;

  /* * 响应包括数据标头和正文。embed的单个响应，embedMany的集群。 */
  readonly response:
    | { headers?: Record<string, string>; body?: unknown }
    | Array<{ headers?: Record<string, string>; body?: unknown } | undefined>
    | undefined;
};

/**
 * 当单独的嵌入模型调用（内部操作 doEmbed）开始时触发事件。
 *
 * 对于`embed`，只有一个调用。对于`embedMany`，可能有多个
 * 当值被分块时调用。
 */
export type EmbeddingModelCallStartEvent = {
  /* * 此嵌入调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 此单独 doEmbed 调用的唯一标识符，用于关联工具块内的开始/结束。 */
  readonly embedCallId: string;

  /* * 标识操作内部（例如`ai.embed.doEmbed`或`ai.embedMany.doEmbed`）。 */
  readonly operationId: string;

  /* * 提供商标识符。 */
  readonly provider: string;

  /* * 具体型号标识符。 */
  readonly modelId: string;

  /* * 嵌入到该特定模型调用中的值。 */
  readonly values: Array<string>;
};

/**
 * 当单个嵌入式模型调用（doEmbed）完成时触发事件。
 *
 * 包含嵌入、用法以及模型响应中的任何警告。
 */
export type EmbeddingModelCallEndEvent = {
  /* * 此嵌入调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 此单独 doEmbed 调用的唯一标识符，用于关联工具块内的开始/结束。 */
  readonly embedCallId: string;

  /* * 标识操作内部（例如`ai.embed.doEmbed`或`ai.embedMany.doEmbed`）。 */
  readonly operationId: string;

  /* * 提供商标识符。 */
  readonly provider: string;

  /* * 具体型号标识符。 */
  readonly modelId: string;

  /* * 嵌入到该特定模型调用中的值。 */
  readonly values: Array<string>;

  /* * 模型调用产生的嵌入。 */
  readonly embeddings: Array<Embedding>;

  /* * 此模型调用的令牌使用情况。 */
  readonly usage: EmbeddingModelUsage;
};
