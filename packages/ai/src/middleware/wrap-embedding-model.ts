import type {
  EmbeddingModelV3,
  EmbeddingModelV4,
  EmbeddingModelV4CallOptions,
  EmbeddingModelV4Result,
} from '@ai-sdk/provider';
import { asArray } from '@ai-sdk/provider-utils';
import { asEmbeddingModelV4 } from '../model/as-embedding-model-v4';
import type { EmbeddingModelMiddleware } from '../types';

/**
 * 使用中间件功能封装 EmbeddingModelV4 实例。
 * 该功能允许您应用中间件来转换参数，
 * 嵌入模型的换行嵌入操作。
 *
 * @param options - 用于包装嵌入模型的配置选项。
 * @param options.model - 要包装的原始 EmbeddingModelV4 实例。
 * @param options.middleware - 应用于嵌入模型的中间件。当提供多个中间件时，第一个中间件将首先转换输入，最后一个中间件将直接包裹模型。
 * @param options.modelId - 可选的自定义模型 ID 可覆盖原始模型的 ID。
 * @param options.providerId - 可选的自定义提供程序 ID，用于覆盖原始模型的提供程序 ID。
 * @returns 应用了中间件的新 EmbeddingModelV4 实例。
 */
export const wrapEmbeddingModel = ({
  model: inputModel,
  middleware: middlewareArg,
  modelId,
  providerId,
}: {
  model: EmbeddingModelV3 | EmbeddingModelV4;
  middleware: EmbeddingModelMiddleware | EmbeddingModelMiddleware[];
  modelId?: string;
  providerId?: string;
}): EmbeddingModelV4 => {
  const model = asEmbeddingModelV4(inputModel);
  return [...asArray(middlewareArg)]
    .reverse()
    .reduce((wrappedModel, middleware) => {
      return doWrap({ model: wrappedModel, middleware, modelId, providerId });
    }, model);
};

const doWrap = ({
  model,
  middleware: {
    transformParams,
    wrapEmbed,
    overrideProvider,
    overrideModelId,
    overrideMaxEmbeddingsPerCall,
    overrideSupportsParallelCalls,
  },
  modelId,
  providerId,
}: {
  model: EmbeddingModelV4;
  middleware: EmbeddingModelMiddleware;
  modelId?: string;
  providerId?: string;
}): EmbeddingModelV4 => {
  async function doTransform({
    params,
  }: {
    params: EmbeddingModelV4CallOptions;
  }) {
    return transformParams ? await transformParams({ params, model }) : params;
  }

  return {
    specificationVersion: 'v4',
    provider: providerId ?? overrideProvider?.({ model }) ?? model.provider,
    modelId: modelId ?? overrideModelId?.({ model }) ?? model.modelId,
    maxEmbeddingsPerCall:
      overrideMaxEmbeddingsPerCall?.({ model }) ?? model.maxEmbeddingsPerCall,
    supportsParallelCalls:
      overrideSupportsParallelCalls?.({ model }) ?? model.supportsParallelCalls,
    async doEmbed(
      params: EmbeddingModelV4CallOptions,
    ): Promise<EmbeddingModelV4Result> {
      const transformedParams = await doTransform({ params });
      const doEmbed = async () => await model.doEmbed(transformedParams);
      return wrapEmbed
        ? await wrapEmbed({
            doEmbed,
            params: transformedParams,
            model,
          })
        : await doEmbed();
    },
  };
};
