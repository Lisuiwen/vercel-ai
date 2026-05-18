import type { JSONObject } from '@ai-sdk/provider';
import type { ProviderOptions } from '@ai-sdk/provider-utils';
import type { ProviderMetadata } from '../types';
import type { Warning } from '../types/warning';

/**
 * 事件传递给“onStart”回调以进行重新排名操作。
 *
 * 在操作开始时调用重排序模型之前调用。
 */
export type RerankStartEvent = {
  /* * 此重新排序调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 标识操作类型（'ai.rerank'）。 */
  readonly operationId: string;

  // ** 提供商标识符（例如“openai”、“anthropic”）。 */
  readonly provider: string;

  /* * 特定型号标识符（例如“gpt-4o”）。 */
  readonly modelId: string;
  /* * 文档被重新排序。 */
  readonly documents: Array<JSONObject | string>;

  /* * 对文档重新排序的查询。 */
  readonly query: string;

  /* * 要返回的顶级文档的数量。 */
  readonly topN: number | undefined;

  /* * 失败请求的最大重试次数。 */
  readonly maxRetries: number;
  /* * 随请求一起发送的附加 HTTP 标头。 */
  readonly headers: Record<string, string | undefined> | undefined;

  /* * 其他特定于提供商的选项。 */
  readonly providerOptions: ProviderOptions | undefined;
};

/**
 * 事件传递给“onFinish”回调以进行重新排名操作。
 *
 * 在操作完成、重排序模型返回后调用。
 */
export type RerankEndEvent = {
  /* * 此重新排序调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 标识操作类型（'ai.rerank'）。 */
  readonly operationId: string;

  // ** 提供商标识符（例如“openai”、“anthropic”）。 */
  readonly provider: string;

  /* * 特定型号标识符（例如“gpt-4o”）。 */
  readonly modelId: string;

  /* * 重新排序的文档。 */
  readonly documents: Array<JSONObject | string>;

  /* * 文档重新排序所依据的查询。 */
  readonly query: string;

  /* * 重新排序的结果按相关性得分降序排列。 */
  readonly ranking: Array<{
    originalIndex: number;
    score: number;
    document: JSONObject | string;
  }>;

  /* *来自重新排名模型的警告。 */
  readonly warnings: Array<Warning>;

  /* * 可选的特定于提供商的元数据。 */
  readonly providerMetadata: ProviderMetadata | undefined;

  /* * 响应数据包括标头和正文。 */
  readonly response: {
    id?: string;
    timestamp: Date;
    modelId: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
};

/**
 * 当单独的重新排序模型调用（内部 doRerank）开始时触发事件。
 */
export type RerankingModelCallStartEvent = {
  /* * 此重新排序调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 标识内部操作（'ai.rerank.doRerank'）。 */
  readonly operationId: string;

  /* * 提供商标识符。 */
  readonly provider: string;

  /* * 具体型号标识符。 */
  readonly modelId: string;

  /* * 文档被重新排序。 */
  readonly documents: Array<JSONObject | string>;

  /* * 文档的类型（“文本”或“对象”）。 */
  readonly documentsType: string;

  /* * 重新排名的查询。 */
  readonly query: string;

  /* * 要返回的顶级文档的数量。 */
  readonly topN: number | undefined;
};

/**
 * 当单个重新排序模型调用 (doRerank) 完成时触发事件。
 *
 * 包含模型响应的排名结果。
 */
export type RerankingModelCallEndEvent = {
  /* * 此重新排序调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 标识内部操作（'ai.rerank.doRerank'）。 */
  readonly operationId: string;

  /* * 提供商标识符。 */
  readonly provider: string;

  /* * 具体型号标识符。 */
  readonly modelId: string;

  /* * 文档的类型（“文本”或“对象”）。 */
  readonly documentsType: string;

  /* * 排名结果来自模型。 */
  readonly ranking: Array<{ index: number; relevanceScore: number }>;
};
