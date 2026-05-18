import type { ProviderV2, ProviderV3, ProviderV4 } from '@ai-sdk/provider';
import type { ImageModelMiddleware } from '../types/image-model-middleware';
import type { LanguageModelMiddleware } from '../types/language-model-middleware';
import { wrapImageModel } from './wrap-image-model';
import { wrapLanguageModel } from './wrap-language-model';
import { asProviderV4 } from '../model/as-provider-v4';

/**
 * 使用中间件功能封装ProviderV4实例。
 * 该功能允许您将中间件应用于所有语言模型
 * 来自提供者，使您能够转换参数、包装生成
 * 操作，以及每种语言模型的包装流操作。
 *
 * @param options - 用于包装提供程序的配置选项。
 * @param options.provider - 要包装的原始 ProviderV4 实例。
 * @param options.languageModelMiddleware - 该中间件适用于提供商的所有语言模型。当提供多个中间件时，第一个中间件将首先转换输入，最后一个中间件将直接包裹模型。
 * @param options.imageModelMiddleware - 可选的中间件适用于提供商的所有图像模型。当提供多个中间件时，第一个中间件将首先转换输入，最后一个中间件将直接包裹模型。
 * @returns 一个新的 ProviderV4 实例，其中间件适用于所有语言模型。
 */
export function wrapProvider({
  provider,
  languageModelMiddleware,
  imageModelMiddleware,
}: {
  provider: ProviderV4 | ProviderV3 | ProviderV2;
  languageModelMiddleware: LanguageModelMiddleware | LanguageModelMiddleware[];
  imageModelMiddleware?: ImageModelMiddleware | ImageModelMiddleware[];
}): ProviderV4 {
  const providerV4 = asProviderV4(provider);
  return {
    specificationVersion: 'v4',
    languageModel: (modelId: string) =>
      wrapLanguageModel({
        model: providerV4.languageModel(modelId),
        middleware: languageModelMiddleware,
      }),
    embeddingModel: providerV4.embeddingModel,
    imageModel: (modelId: string) => {
      let model = providerV4.imageModel(modelId);

      if (imageModelMiddleware != null) {
        model = wrapImageModel({ model, middleware: imageModelMiddleware });
      }

      return model;
    },
    transcriptionModel: providerV4.transcriptionModel,
    speechModel: providerV4.speechModel,
    rerankingModel: providerV4.rerankingModel,
  };
}
