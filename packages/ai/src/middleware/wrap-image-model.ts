import type {
  ImageModelV2,
  ImageModelV3,
  ImageModelV4,
  ImageModelV4CallOptions,
  ImageModelV4Result,
} from '@ai-sdk/provider';
import { asArray } from '@ai-sdk/provider-utils';
import { asImageModelV4 } from '../model/as-image-model-v4';
import type { ImageModelMiddleware } from '../types';

/**
 * 使用中间件功能封装 ImageModelV4 实例。
 * 该功能允许您应用中间件来转换参数
 * 并包装图像模型的生成操作。
 *
 * @param options - 用于包装图像模型的配置选项。
 * @param options.model - 要包装的原始 ImageModelV4 实例。
 * @param options.middleware - 应用于图像模型的中间件。当提供多个中间件时，第一个中间件将首先转换输入，最后一个中间件将直接包裹模型。
 * @param options.modelId - 可选的自定义模型 ID 可覆盖原始模型的 ID。
 * @param options.providerId - 可选的自定义提供程序 ID，用于覆盖原始模型的提供程序 ID。
 * @returns 应用了中间件的新 ImageModelV4 实例。
 */
export const wrapImageModel = ({
  model: inputModel,
  middleware: middlewareArg,
  modelId,
  providerId,
}: {
  model: ImageModelV2 | ImageModelV3 | ImageModelV4;
  middleware: ImageModelMiddleware | ImageModelMiddleware[];
  modelId?: string;
  providerId?: string;
}): ImageModelV4 => {
  const model = asImageModelV4(inputModel);
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
    overrideProvider,
    overrideModelId,
    overrideMaxImagesPerCall,
  },
  modelId,
  providerId,
}: {
  model: ImageModelV4;
  middleware: ImageModelMiddleware;
  modelId?: string;
  providerId?: string;
}): ImageModelV4 => {
  async function doTransform({ params }: { params: ImageModelV4CallOptions }) {
    return transformParams ? await transformParams({ params, model }) : params;
  }

  const maxImagesPerCallRaw =
    overrideMaxImagesPerCall?.({ model }) ?? model.maxImagesPerCall;

  // 确保提供者实现依赖于`maxImagesPerCall`中的`this`
  // 将值复制到包装对象后继续工作。
  const maxImagesPerCall =
    maxImagesPerCallRaw instanceof Function
      ? maxImagesPerCallRaw.bind(model)
      : maxImagesPerCallRaw;

  return {
    specificationVersion: 'v4',
    provider: providerId ?? overrideProvider?.({ model }) ?? model.provider,
    modelId: modelId ?? overrideModelId?.({ model }) ?? model.modelId,
    maxImagesPerCall,
    async doGenerate(
      params: ImageModelV4CallOptions,
    ): Promise<ImageModelV4Result> {
      const transformedParams = await doTransform({ params });
      const doGenerate = async () => await model.doGenerate(transformedParams);
      return wrapGenerate
        ? await wrapGenerate({
            doGenerate,
            params: transformedParams,
            model,
          })
        : await doGenerate();
    },
  };
};
