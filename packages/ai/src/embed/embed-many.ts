import {
  createIdGenerator,
  withUserAgentSuffix,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { logWarnings } from '../logger/log-warnings';
import { resolveEmbeddingModel } from '../model/resolve-model';
import { createTelemetryDispatcher } from '../telemetry/create-telemetry-dispatcher';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import type { Embedding, EmbeddingModel, ProviderMetadata } from '../types';
import type { Warning } from '../types/warning';
import type { Callback } from '../util/callback';
import { notify } from '../util/notify';
import { prepareRetries } from '../util/prepare-retries';
import { splitArray } from '../util/split-array';
import type { EmbedEndEvent, EmbedStartEvent } from './embed-events';
import type { EmbedManyResult } from './embed-many-result';
import { VERSION } from '../version';

const originalGenerateCallId = createIdGenerator({
  prefix: 'call',
  size: 24,
});

/**
 * 使用嵌入模型嵌入多个值。值的类型已定义
 * 通过嵌入模型。
 *
 * 如果模型满足以下条件，`embedMany`会自动将大请求分割成更小的块：
 * 对一次调用中可以生成的嵌入数量有限制。
 *
 * @param model - 要使用的嵌入模型。
 * @param values - 应嵌入的价值观。
 *
 * @param maxRetries - 最大重试次数。设置为 0 以禁用重试。默认值：2。
 * @param abortSignal - 可用于取消调用的可选中止信号。
 * @param headers - 与请求一起发送的附加 HTTP 标头。仅适用于基于 HTTP 的提供商。
 *
 * @param maxParallelCalls - 最大并发请求数。默认值：无穷大。
 *
 * @param telemetry - 可选遥测配置。
 *
 * @param providerOptions - 其他特定于提供商的选项。他们通过
 * 从AI SDK发送给成功并实现特定的成功
 * 可以完全封装在提供者中的功能。
 *
 * @returns 包含嵌入、值和附加信息的结果对象。
 */
export async function embedMany({
  model: modelArg,
  values,
  maxParallelCalls = Infinity,
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
   * 要使用的嵌入模型。
   */
  model: EmbeddingModel;

  /**
   * 应嵌入的价值观。
   */
  values: Array<string>;

  /**
   * 每个嵌入模型调用的最大重试次数。设置为 0 以禁用重试。
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
   * 仅适用于基于 HTTP 的业务。
   */
  headers?: Record<string, string>;

  /**
   * 可选遥测配置。
   */
  telemetry?: TelemetryOptions;

  /**
   * 可选遥测配置。
   *
   * @deprecated 请改用`遥测`。该别名将在未来的主要版本中删除。
   */
  experimental_telemetry?: TelemetryOptions;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从AI SDK发送给成功并实现特定的成功
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;

  /**
   * 最大并发请求数。
   *
   * @default Infinity
   */
  maxParallelCalls?: number;

  /**
   * embedMany操作开始时调用的回调，
   * 在调用嵌入模型之前。
   */
  experimental_onStart?: Callback<EmbedStartEvent>;

  /**
   * embedMany完成操作时调用的回调，
   * 所有嵌入模型调用返回后。
   */
  experimental_onEnd?: Callback<EmbedEndEvent>;

  /**
   * 内部的。仅供测试使用。可能会更改，恕不另行通知。
   */
  _internal?: {
    generateCallId?: () => string;
  };
}): Promise<EmbedManyResult> {
  const model = resolveEmbeddingModel(modelArg);

  const { maxRetries, retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal,
  });

  const headersWithUserAgent = withUserAgentSuffix(
    headers ?? {},
    `ai/${VERSION}`,
  );

  const callId = generateCallId();

  const telemetryDispatcher = createTelemetryDispatcher({
    telemetry,
  });

  await notify({
    event: {
      callId,
      operationId: 'ai.embedMany',
      provider: model.provider,
      modelId: model.modelId,
      value: values,
      maxRetries,
      headers: headersWithUserAgent,
      providerOptions,
    },
    callbacks: [onStart, telemetryDispatcher.onStart],
  });

  try {
    const [maxEmbeddingsPerCall, supportsParallelCalls] = await Promise.all([
      model.maxEmbeddingsPerCall,
      model.supportsParallelCalls,
    ]);

    if (maxEmbeddingsPerCall == null || maxEmbeddingsPerCall === Infinity) {
      const { embeddings, usage, warnings, response, providerMetadata } =
        await retry(async () => {
          const embedCallId = generateCallId();

          await notify({
            event: {
              callId,
              embedCallId,
              operationId: 'ai.embedMany.doEmbed',
              provider: model.provider,
              modelId: model.modelId,
              values,
            },
            callbacks: [telemetryDispatcher.onEmbedStart],
          });

          const modelResponse = await model.doEmbed({
            values,
            abortSignal,
            headers: headersWithUserAgent,
            providerOptions,
          });

          const embeddings = modelResponse.embeddings;
          const usage = modelResponse.usage ?? { tokens: NaN };

          await notify({
            event: {
              callId,
              embedCallId,
              operationId: 'ai.embedMany.doEmbed',
              provider: model.provider,
              modelId: model.modelId,
              values,
              embeddings,
              usage,
            },
            callbacks: [telemetryDispatcher.onEmbedEnd],
          });

          return {
            embeddings,
            usage,
            warnings: modelResponse.warnings ?? [],
            providerMetadata: modelResponse.providerMetadata,
            response: modelResponse.response,
          };
        });

      logWarnings({
        warnings,
        provider: model.provider,
        model: model.modelId,
      });

      await notify({
        event: {
          callId,
          operationId: 'ai.embedMany',
          provider: model.provider,
          modelId: model.modelId,
          value: values,
          embedding: embeddings,
          usage,
          warnings,
          providerMetadata,
          response: [response],
        },
        callbacks: [onEnd, telemetryDispatcher.onEnd],
      });

      return new DefaultEmbedManyResult({
        values,
        embeddings,
        usage,
        warnings,
        providerMetadata,
        responses: [response],
      });
    }

    const valueChunks = splitArray(values, maxEmbeddingsPerCall);

    const embeddings: Array<Embedding> = [];
    const warnings: Array<Warning> = [];
    const responses: Array<
      | {
          headers?: Record<string, string>;
          body?: unknown;
        }
      | undefined
    > = [];
    let tokens = 0;
    let providerMetadata: ProviderMetadata | undefined;

    const parallelChunks = splitArray(
      valueChunks,
      supportsParallelCalls ? maxParallelCalls : 1,
    );

    for (const parallelChunk of parallelChunks) {
      const results = await Promise.all(
        parallelChunk.map(chunk => {
          return retry(async () => {
            const embedCallId = generateCallId();

            await notify({
              event: {
                callId,
                embedCallId,
                operationId: 'ai.embedMany.doEmbed',
                provider: model.provider,
                modelId: model.modelId,
                values: chunk,
              },
              callbacks: [telemetryDispatcher.onEmbedStart],
            });

            const modelResponse = await model.doEmbed({
              values: chunk,
              abortSignal,
              headers: headersWithUserAgent,
              providerOptions,
            });

            const chunkEmbeddings = modelResponse.embeddings;
            const usage = modelResponse.usage ?? { tokens: NaN };

            await notify({
              event: {
                callId,
                embedCallId,
                operationId: 'ai.embedMany.doEmbed',
                provider: model.provider,
                modelId: model.modelId,
                values: chunk,
                embeddings: chunkEmbeddings,
                usage,
              },
              callbacks: [telemetryDispatcher.onEmbedEnd],
            });

            return {
              embeddings: chunkEmbeddings,
              usage,
              warnings: modelResponse.warnings ?? [],
              providerMetadata: modelResponse.providerMetadata,
              response: modelResponse.response,
            };
          });
        }),
      );

      for (const result of results) {
        embeddings.push(...result.embeddings);
        warnings.push(...result.warnings);
        responses.push(result.response);
        tokens += result.usage.tokens;
        if (result.providerMetadata) {
          if (!providerMetadata) {
            providerMetadata = { ...result.providerMetadata };
          } else {
            for (const [providerName, metadata] of Object.entries(
              result.providerMetadata,
            )) {
              providerMetadata[providerName] = {
                ...(providerMetadata[providerName] ?? {}),
                ...metadata,
              };
            }
          }
        }
      }
    }

    logWarnings({
      warnings,
      provider: model.provider,
      model: model.modelId,
    });

    await notify({
      event: {
        callId,
        operationId: 'ai.embedMany',
        provider: model.provider,
        modelId: model.modelId,
        value: values,
        embedding: embeddings,
        usage: { tokens },
        warnings,
        providerMetadata,
        response: responses,
      },
      callbacks: [onEnd, telemetryDispatcher.onEnd],
    });

    return new DefaultEmbedManyResult({
      values,
      embeddings,
      usage: { tokens },
      warnings,
      providerMetadata: providerMetadata,
      responses,
    });
  } catch (error) {
    await telemetryDispatcher.onError?.({ callId, error });
    throw error;
  }
}

class DefaultEmbedManyResult implements EmbedManyResult {
  readonly values: EmbedManyResult['values'];
  readonly embeddings: EmbedManyResult['embeddings'];
  readonly usage: EmbedManyResult['usage'];
  readonly warnings: EmbedManyResult['warnings'];
  readonly providerMetadata: EmbedManyResult['providerMetadata'];
  readonly responses: EmbedManyResult['responses'];

  constructor(options: {
    values: EmbedManyResult['values'];
    embeddings: EmbedManyResult['embeddings'];
    usage: EmbedManyResult['usage'];
    warnings: EmbedManyResult['warnings'];
    providerMetadata?: EmbedManyResult['providerMetadata'];
    responses?: EmbedManyResult['responses'];
  }) {
    this.values = options.values;
    this.embeddings = options.embeddings;
    this.usage = options.usage;
    this.warnings = options.warnings;
    this.providerMetadata = options.providerMetadata;
    this.responses = options.responses;
  }
}
