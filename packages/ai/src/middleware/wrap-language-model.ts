import type {
  LanguageModelV2,
  LanguageModelV3,
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamResult,
} from '@ai-sdk/provider';
import { asArray } from '@ai-sdk/provider-utils';
import { asLanguageModelV4 } from '../model/as-language-model-v4';
import type { LanguageModelMiddleware } from '../types';

/**
 * 使用中间件功能封装 LanguageModelV4 实例。
 * 该功能允许您应用中间件来转换参数，
 * 包装生成操作，以及包装语言模型的流操作。
 *
 * @param options - 用于包装语言模型的配置选项。
 * @param options.model - 要包装的原始 LanguageModelV4 实例。
 * @param options.middleware - 应用于语言模型的中间件。当提供多个中间件时，第一个中间件将首先转换输入，最后一个中间件将直接包裹模型。
 * @param options.modelId - 可选的自定义模型 ID 可覆盖原始模型的 ID。
 * @param options.providerId - 可选的自定义提供程序 ID，用于覆盖原始模型的提供程序 ID。
 * @returns 应用了中间件的新 LanguageModelV4 实例。
 */
export const wrapLanguageModel = ({
  model: inputModel,
  middleware: middlewareArg,
  modelId,
  providerId,
}: {
  model: LanguageModelV2 | LanguageModelV3 | LanguageModelV4;
  middleware: LanguageModelMiddleware | LanguageModelMiddleware[];
  modelId?: string;
  providerId?: string;
}): LanguageModelV4 => {
  const model = asLanguageModelV4(inputModel);
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
    wrapGenerate,
    wrapStream,
    overrideProvider,
    overrideModelId,
    overrideSupportedUrls,
  },
  modelId,
  providerId,
}: {
  model: LanguageModelV4;
  middleware: LanguageModelMiddleware;
  modelId?: string;
  providerId?: string;
}): LanguageModelV4 => {
  async function doTransform({
    params,
    type,
  }: {
    params: LanguageModelV4CallOptions;
    type: 'generate' | 'stream';
  }) {
    return transformParams
      ? await transformParams({ params, type, model })
      : params;
  }

  return {
    specificationVersion: 'v4',

    provider: providerId ?? overrideProvider?.({ model }) ?? model.provider,
    modelId: modelId ?? overrideModelId?.({ model }) ?? model.modelId,
    supportedUrls: overrideSupportedUrls?.({ model }) ?? model.supportedUrls,

    async doGenerate(
      params: LanguageModelV4CallOptions,
    ): Promise<LanguageModelV4GenerateResult> {
      const transformedParams = await doTransform({ params, type: 'generate' });
      const doGenerate = async () => await model.doGenerate(transformedParams);
      const doStream = async () => await model.doStream(transformedParams);
      return wrapGenerate
        ? await wrapGenerate({
            doGenerate,
            doStream,
            params: transformedParams,
            model,
          })
        : await doGenerate();
    },

    async doStream(
      params: LanguageModelV4CallOptions,
    ): Promise<LanguageModelV4StreamResult> {
      const transformedParams = await doTransform({ params, type: 'stream' });
      const doGenerate = async () => await model.doGenerate(transformedParams);
      const doStream = async () => await model.doStream(transformedParams);
      return wrapStream
        ? await wrapStream({
            doGenerate,
            doStream,
            params: transformedParams,
            model,
          })
        : await doStream();
    },
  };
};
