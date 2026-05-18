import {
  createIdGenerator,
  withUserAgentSuffix,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { logWarnings } from '../logger/log-warnings';
import { resolveEmbeddingModel } from '../model/resolve-model';
import { createTelemetryDispatcher } from '../telemetry/create-telemetry-dispatcher';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import type { EmbeddingModel } from '../types';
import type { Callback } from '../util/callback';
import { notify } from '../util/notify';
import { prepareRetries } from '../util/prepare-retries';
import { VERSION } from '../version';
import type { EmbedEndEvent, EmbedStartEvent } from './embed-events';
import type { EmbedResult } from './embed-result';

const originalGenerateCallId = createIdGenerator({
  prefix: 'call',
  size: 24,
});

/**
 * 使用嵌入模型嵌入值。值的类型由嵌入模型定义。
 *
 * @param model - 要使用的嵌入模型。
 * @param value - 应嵌入的值。
 *
 * @param maxRetries - 最大重试次数。设置为 0 以禁用重试。默认值：2。
 * @param abortSignal - 可用于取消调用的可选中止信号。
 * @param headers - 与请求一起发送的附加 HTTP 标头。仅适用于基于 HTTP 的提供商。
 *
 * @param telemetry - 可选遥测配置。
 *
 * @param providerOptions - 其他特定于提供商的选项。他们通过
 * 从AI SDK发送给成功并实现特定的成功
 * 可以完全封装在提供者中的功能。
 *
 * @returns 包含嵌入、值和附加信息的结果对象。
 */
export async function embed({
  model: modelArg,
  value,
  providerOptions,
  maxRetries: maxRetriesArg,
  abortSignal,
  headers,
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
   * 应嵌入的值。
   */
  value: string;

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
   * 其他特定于提供商的选项。他们通过
   * 从AI SDK发送给成功并实现特定的成功
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;

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
   * 嵌入操作开始时调用的回调，
   * 在调用嵌入模型之前。
   */
  experimental_onStart?: Callback<EmbedStartEvent>;

  /**
   * 嵌入操作完成时调用的回调，
   * 嵌入模型返回后。
   */
  experimental_onEnd?: Callback<EmbedEndEvent>;

  /**
   * 内部的。仅供测试使用。可能会更改，恕不另行通知。
   */
  _internal?: {
    generateCallId?: () => string;
  };
}): Promise<EmbedResult> {
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
      operationId: 'ai.embed',
      provider: model.provider,
      modelId: model.modelId,
      value,
      maxRetries,
      headers: headersWithUserAgent,
      providerOptions,
    },
    callbacks: [onStart, telemetryDispatcher.onStart],
  });

  try {
    const { embedding, usage, warnings, response, providerMetadata } =
      await retry(async () => {
        const embedCallId = generateCallId();

        await notify({
          event: {
            callId,
            embedCallId,
            operationId: 'ai.embed.doEmbed',
            provider: model.provider,
            modelId: model.modelId,
            values: [value],
          },
          callbacks: [telemetryDispatcher.onEmbedStart],
        });

        const modelResponse = await model.doEmbed({
          values: [value],
          abortSignal,
          headers: headersWithUserAgent,
          providerOptions,
        });

        const embedding = modelResponse.embeddings[0];
        const usage = modelResponse.usage ?? { tokens: NaN };

        await notify({
          event: {
            callId,
            embedCallId,
            operationId: 'ai.embed.doEmbed',
            provider: model.provider,
            modelId: model.modelId,
            values: [value],
            embeddings: modelResponse.embeddings,
            usage,
          },
          callbacks: [telemetryDispatcher.onEmbedEnd],
        });

        return {
          embedding,
          usage,
          warnings: modelResponse.warnings ?? [],
          providerMetadata: modelResponse.providerMetadata,
          response: modelResponse.response,
        };
      });

    logWarnings({ warnings, provider: model.provider, model: model.modelId });

    await notify({
      event: {
        callId,
        operationId: 'ai.embed',
        provider: model.provider,
        modelId: model.modelId,
        value,
        embedding,
        usage,
        warnings,
        providerMetadata,
        response,
      },
      callbacks: [onEnd, telemetryDispatcher.onEnd],
    });

    return new DefaultEmbedResult({
      value,
      embedding,
      usage,
      warnings,
      providerMetadata,
      response,
    });
  } catch (error) {
    await telemetryDispatcher.onError?.({ callId, error });
    throw error;
  }
}

class DefaultEmbedResult implements EmbedResult {
  readonly value: EmbedResult['value'];
  readonly embedding: EmbedResult['embedding'];
  readonly usage: EmbedResult['usage'];
  readonly warnings: EmbedResult['warnings'];
  readonly providerMetadata: EmbedResult['providerMetadata'];
  readonly response: EmbedResult['response'];

  constructor(options: {
    value: EmbedResult['value'];
    embedding: EmbedResult['embedding'];
    usage: EmbedResult['usage'];
    warnings: EmbedResult['warnings'];
    providerMetadata?: EmbedResult['providerMetadata'];
    response?: EmbedResult['response'];
  }) {
    this.value = options.value;
    this.embedding = options.embedding;
    this.usage = options.usage;
    this.warnings = options.warnings;
    this.providerMetadata = options.providerMetadata;
    this.response = options.response;
  }
}
