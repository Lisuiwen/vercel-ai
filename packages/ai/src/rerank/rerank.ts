import type { JSONObject, RerankingModelV4CallOptions } from '@ai-sdk/provider';
import {
  createIdGenerator,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { prepareRetries } from '../../src/util/prepare-retries';
import { logWarnings } from '../logger/log-warnings';
import { resolveRerankingModel } from '../model/resolve-model';
import { createTelemetryDispatcher } from '../telemetry/create-telemetry-dispatcher';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import type { RerankingModel } from '../types';
import type { Callback } from '../util/callback';
import { notify } from '../util/notify';
import type { RerankEndEvent, RerankStartEvent } from './rerank-events';
import type { RerankResult } from './rerank-result';

const originalGenerateCallId = createIdGenerator({
  prefix: 'call',
  size: 24,
});

/**
 * 使用重新排序模型对文档进行重新排序。值的类型由重新排序模型定义。
 *
 * @param model - The reranking model to use.
 * @param documents - The documents that should be reranked.
 * @param query - The query to rerank the documents against.
 * @param topN - Number of top documents to return.
 *
 * @param maxRetries - Maximum number of retries. Set to 0 to disable retries. Default: 2.
 * @param abortSignal - An optional abort signal that can be used to cancel the call.
 * @param headers - Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
 * @param providerOptions - Additional provider-specific options.
 * @param telemetry - Optional telemetry configuration.
 *
 * @returns A result object that contains the reranked documents, the reranked indices, and additional information.
 */
export async function rerank<VALUE extends JSONObject | string>({
  model: modelArg,
  documents,
  query,
  topN,
  maxRetries: maxRetriesArg,
  abortSignal,
  headers,
  providerOptions,
  experimental_telemetry,
  telemetry = experimental_telemetry,
  experimental_onStart: onStart,
  experimental_onEnd: onEnd,
  _internal: { generateCallId = originalGenerateCallId } = {},
}: {
  /**
   * 要使用的重新排序模型。
   */
  model: RerankingModel;

  /**
   * 应重新排序的文档。
   */
  documents: Array<VALUE>;

  /**
   * 用于对文档重新排序的查询。
   */
  query: string;

  /**
   * 要返回的顶级文档数。
   */
  topN?: number;

  /**
   * 每次重新排序模型调用的最大重试次数。设置为 0 以禁用重试。
   *
   * @default 2
   */
  maxRetries?: number;

  /**
   * 中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 要包含在请求中的附加标头。
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: Record<string, string>;

  /**
   * 可选遥测配置。
   */
  telemetry?: TelemetryOptions;

  /**
   * 可选遥测配置。
   *
   * @deprecated 请改用“遥测”。该别名将在未来的主要版本中删除。
   */
  experimental_telemetry?: TelemetryOptions;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;

  /**
   * 重新排序操作开始时调用的回调，
   * 在调用重新排序模型之前。
   */
  experimental_onStart?: Callback<RerankStartEvent>;

  /**
   * 重新排序操作完成时调用的回调，
   * 重排序模型返回后。
   */
  experimental_onEnd?: Callback<RerankEndEvent>;

  /**
   * 内部的。仅供测试使用。可能会更改，恕不另行通知。
   */
  _internal?: {
    generateCallId?: () => string;
  };
}): Promise<RerankResult<VALUE>> {
  const model = resolveRerankingModel(modelArg);
  const callId = generateCallId();

  const telemetryDispatcher = createTelemetryDispatcher({
    telemetry,
  });

  if (documents.length === 0) {
    await notify({
      event: {
        callId,
        operationId: 'ai.rerank',
        provider: model.provider,
        modelId: model.modelId,
        documents,
        query,
        topN,
        maxRetries: maxRetriesArg ?? 2,
        headers,
        providerOptions,
      },
      callbacks: [onStart, telemetryDispatcher.onStart],
    });

    await notify({
      event: {
        callId,
        operationId: 'ai.rerank',
        provider: model.provider,
        modelId: model.modelId,
        documents,
        query,
        ranking: [],
        warnings: [],
        providerMetadata: undefined,
        response: {
          timestamp: new Date(),
          modelId: model.modelId,
        },
      },
      callbacks: [onEnd, telemetryDispatcher.onEnd],
    });

    return new DefaultRerankResult({
      originalDocuments: [],
      ranking: [],
      providerMetadata: undefined,
      response: {
        timestamp: new Date(),
        modelId: model.modelId,
      },
    });
  }

  const { maxRetries, retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal,
  });

  const documentsToSend: RerankingModelV4CallOptions['documents'] =
    typeof documents[0] === 'string'
      ? { type: 'text', values: documents as string[] }
      : { type: 'object', values: documents as JSONObject[] };

  await notify({
    event: {
      callId,
      operationId: 'ai.rerank',
      provider: model.provider,
      modelId: model.modelId,
      documents,
      query,
      topN,
      maxRetries,
      headers,
      providerOptions,
    },
    callbacks: [onStart, telemetryDispatcher.onStart],
  });

  try {
    const { ranking, response, providerMetadata, warnings } = await retry(
      async () => {
        await notify({
          event: {
            callId,
            operationId: 'ai.rerank.doRerank',
            provider: model.provider,
            modelId: model.modelId,
            documents,
            documentsType: documentsToSend.type,
            query,
            topN,
          },
          callbacks: [telemetryDispatcher.onRerankStart],
        });

        const modelResponse = await model.doRerank({
          documents: documentsToSend,
          query,
          topN,
          providerOptions,
          abortSignal,
          headers,
        });

        const ranking = modelResponse.ranking;

        await notify({
          event: {
            callId,
            operationId: 'ai.rerank.doRerank',
            provider: model.provider,
            modelId: model.modelId,
            documentsType: documentsToSend.type,
            ranking,
          },
          callbacks: [telemetryDispatcher.onRerankEnd],
        });

        return {
          ranking,
          providerMetadata: modelResponse.providerMetadata,
          response: modelResponse.response,
          warnings: modelResponse.warnings,
        };
      },
    );

    logWarnings({
      warnings: warnings ?? [],
      provider: model.provider,
      model: model.modelId,
    });

    await notify({
      event: {
        callId,
        operationId: 'ai.rerank',
        provider: model.provider,
        modelId: model.modelId,
        documents,
        query,
        ranking: ranking.map(r => ({
          originalIndex: r.index,
          score: r.relevanceScore,
          document: documents[r.index],
        })),
        warnings: warnings ?? [],
        providerMetadata,
        response: {
          id: response?.id,
          timestamp: response?.timestamp ?? new Date(),
          modelId: response?.modelId ?? model.modelId,
          headers: response?.headers,
          body: response?.body,
        },
      },
      callbacks: [onEnd, telemetryDispatcher.onEnd],
    });

    return new DefaultRerankResult({
      originalDocuments: documents,
      ranking: ranking.map(ranking => ({
        originalIndex: ranking.index,
        score: ranking.relevanceScore,
        document: documents[ranking.index],
      })),
      providerMetadata,
      response: {
        id: response?.id,
        timestamp: response?.timestamp ?? new Date(),
        modelId: response?.modelId ?? model.modelId,
        headers: response?.headers,
        body: response?.body,
      },
    });
  } catch (error) {
    await telemetryDispatcher.onError?.({ callId, error });
    throw error;
  }
}

class DefaultRerankResult<VALUE> implements RerankResult<VALUE> {
  readonly originalDocuments: RerankResult<VALUE>['originalDocuments'];
  readonly ranking: RerankResult<VALUE>['ranking'];
  readonly response: RerankResult<VALUE>['response'];
  readonly providerMetadata: RerankResult<VALUE>['providerMetadata'];

  constructor(options: {
    originalDocuments: RerankResult<VALUE>['originalDocuments'];
    ranking: RerankResult<VALUE>['ranking'];
    providerMetadata?: RerankResult<VALUE>['providerMetadata'];
    response: RerankResult<VALUE>['response'];
  }) {
    this.originalDocuments = options.originalDocuments;
    this.ranking = options.ranking;
    this.response = options.response;
    this.providerMetadata = options.providerMetadata;
  }

  get rerankedDocuments(): RerankResult<VALUE>['rerankedDocuments'] {
    return this.ranking.map(ranking => ranking.document);
  }
}
