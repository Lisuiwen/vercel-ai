import {
  type EmbeddingModelV4,
  type Experimental_VideoModelV3,
  type Experimental_VideoModelV4,
  type FilesV4,
  type ImageModelV4,
  type LanguageModelV4,
  NoSuchModelError,
  type ProviderV3,
  type ProviderV4,
  type RerankingModelV4,
  type SkillsV4,
  type SpeechModelV4,
  type TranscriptionModelV4,
} from '@ai-sdk/provider';
import { wrapImageModel } from '../middleware/wrap-image-model';
import { wrapLanguageModel } from '../middleware/wrap-language-model';
import { asProviderV4 } from '../model/as-provider-v4';
import { asVideoModelV4 } from '../model/as-video-model-v4';
import type { ImageModelMiddleware, LanguageModelMiddleware } from '../types';
import type { ExtractLiteralUnion } from '../util/extract-literal-union';
import { NoSuchProviderError } from './no-such-provider-error';

type ProviderWithOptionalVideoModel = {
  videoModel?: (
    modelId: string,
  ) => Experimental_VideoModelV3 | Experimental_VideoModelV4;
};

type RegistryModelType =
  | 'languageModel'
  | 'embeddingModel'
  | 'imageModel'
  | 'transcriptionModel'
  | 'speechModel'
  | 'rerankingModel'
  | 'videoModel';

type ProviderVideoModelIdentifier<PROVIDER> = PROVIDER extends {
  videoModel: (...args: infer ARGS) => unknown;
}
  ? ExtractLiteralUnion<ARGS[0]>
  : never;

export interface ProviderRegistryProvider<
  PROVIDERS extends Record<string, ProviderV4 | ProviderV3> = Record<
    string,
    ProviderV4 | ProviderV3
  >,
  SEPARATOR extends string = ':',
> {
  languageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}${SEPARATOR}${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['languageModel']>>[0]>}`
      : never,
  ): LanguageModelV4;
  languageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}${SEPARATOR}${string}` : never,
  ): LanguageModelV4;

  embeddingModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}${SEPARATOR}${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['embeddingModel']>>[0]>}`
      : never,
  ): EmbeddingModelV4;
  embeddingModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}${SEPARATOR}${string}` : never,
  ): EmbeddingModelV4;

  imageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}${SEPARATOR}${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['imageModel']>>[0]>}`
      : never,
  ): ImageModelV4;
  imageModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}${SEPARATOR}${string}` : never,
  ): ImageModelV4;

  transcriptionModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}${SEPARATOR}${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['transcriptionModel']>>[0]>}`
      : never,
  ): TranscriptionModelV4;
  transcriptionModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}${SEPARATOR}${string}` : never,
  ): TranscriptionModelV4;

  speechModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}${SEPARATOR}${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['speechModel']>>[0]>}`
      : never,
  ): SpeechModelV4;
  speechModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}${SEPARATOR}${string}` : never,
  ): SpeechModelV4;

  rerankingModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}${SEPARATOR}${ExtractLiteralUnion<Parameters<NonNullable<PROVIDERS[KEY]['rerankingModel']>>[0]>}`
      : never,
  ): RerankingModelV4;
  rerankingModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}${SEPARATOR}${string}` : never,
  ): RerankingModelV4;

  videoModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string
      ? `${KEY & string}${SEPARATOR}${ProviderVideoModelIdentifier<PROVIDERS[KEY]>}`
      : never,
  ): Experimental_VideoModelV4;
  videoModel<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? `${KEY & string}${SEPARATOR}${string}` : never,
  ): Experimental_VideoModelV4;

  files<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? KEY & string : never,
  ): FilesV4;

  skills<KEY extends keyof PROVIDERS>(
    id: KEY extends string ? KEY & string : never,
  ): SkillsV4;
}

/**
 * 为具有可选中间件功能的给定提供者创建注册表。
 * 此功能允许您注册多个提供商并可选择应用中间件
 * 到注册表中的所有语言模型，使您能够转换参数、包装生成
 * 操作，以及通过注册表访问的每种语言模型的包装流操作。
 *
 * @param providers - 要在注册表中注册的提供程序实例的记录。
 * @param options - 提供者注册表的配置选项。
 * @param options.separator - 组合标识符中提供商 ID 和型号 ID 之间使用的分隔符。默认为`：`。
 * @param options.languageModelMiddleware - 可选的中间件适用于注册表中的所有语言模型。当提供多个中间件时，第一个中间件将首先转换输入，最后一个中间件将直接包裹模型。
 * @param options.imageModelMiddleware - 可选的中间件可应用于注册表中的所有图像模型。当提供多个中间件时，第一个中间件将首先转换输入，最后一个中间件将直接包裹模型。
 * @returns 一个新的 ProviderRegistryProvider 实例，通过应用于语言和图像模型的可选中间件提供对所有注册提供程序的访问。
 */
export function createProviderRegistry<
  PROVIDERS extends Record<string, ProviderV4 | ProviderV3>,
  SEPARATOR extends string = ':',
>(
  providers: PROVIDERS,
  {
    separator = ':' as SEPARATOR,
    languageModelMiddleware,
    imageModelMiddleware,
  }: {
    separator?: SEPARATOR;
    languageModelMiddleware?:
      | LanguageModelMiddleware
      | LanguageModelMiddleware[];
    imageModelMiddleware?: ImageModelMiddleware | ImageModelMiddleware[];
  } = {},
): ProviderRegistryProvider<PROVIDERS, SEPARATOR> {
  const registry = new DefaultProviderRegistry<PROVIDERS, SEPARATOR>({
    separator,
    languageModelMiddleware,
    imageModelMiddleware,
  });

  for (const [id, provider] of Object.entries(providers)) {
    registry.registerProvider({ id, provider } as {
      id: keyof PROVIDERS;
      provider: PROVIDERS[keyof PROVIDERS];
    });
  }

  return registry;
}

/**
 * @deprecated 请改用`createProviderRegistry`。
 */
export const experimental_createProviderRegistry = createProviderRegistry;

class DefaultProviderRegistry<
  PROVIDERS extends Record<string, ProviderV4 | ProviderV3>,
  SEPARATOR extends string,
> implements ProviderRegistryProvider<PROVIDERS, SEPARATOR> {
  private providers: Partial<
    Record<keyof PROVIDERS, ProviderV4 & ProviderWithOptionalVideoModel>
  > = {};
  private separator: SEPARATOR;
  private languageModelMiddleware?:
    | LanguageModelMiddleware
    | LanguageModelMiddleware[];
  private imageModelMiddleware?: ImageModelMiddleware | ImageModelMiddleware[];

  constructor({
    separator,
    languageModelMiddleware,
    imageModelMiddleware,
  }: {
    separator: SEPARATOR;
    languageModelMiddleware?:
      | LanguageModelMiddleware
      | LanguageModelMiddleware[];
    imageModelMiddleware?: ImageModelMiddleware | ImageModelMiddleware[];
  }) {
    this.separator = separator;
    this.languageModelMiddleware = languageModelMiddleware;
    this.imageModelMiddleware = imageModelMiddleware;
  }

  registerProvider<K extends keyof PROVIDERS>({
    id,
    provider,
  }: {
    id: K;
    provider: PROVIDERS[K];
  }): void {
    const providerV4 = asProviderV4(provider);
    const videoModel = (
      provider as ProviderWithOptionalVideoModel
    ).videoModel?.bind(provider);

    this.providers[id] =
      videoModel == null
        ? providerV4
        : Object.assign(Object.create(Object.getPrototypeOf(providerV4)), {
            ...providerV4,
            videoModel: (modelId: string) =>
              asVideoModelV4(videoModel(modelId)),
          });
  }

  private getProvider(
    id: string,
    modelType: RegistryModelType,
  ): ProviderV4 & ProviderWithOptionalVideoModel {
    const provider = this.providers[id as keyof PROVIDERS];

    if (provider == null) {
      throw new NoSuchProviderError({
        modelId: id,
        modelType,
        providerId: id,
        availableProviders: Object.keys(this.providers),
      });
    }

    return provider;
  }

  private splitId(id: string, modelType: RegistryModelType): [string, string] {
    const index = id.indexOf(this.separator);

    if (index === -1) {
      throw new NoSuchModelError({
        modelId: id,
        modelType,
        message:
          `Invalid ${modelType} id for registry: ${id} ` +
          `(must be in the format "providerId${this.separator}modelId")`,
      });
    }

    return [id.slice(0, index), id.slice(index + this.separator.length)];
  }

  languageModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}${SEPARATOR}${string}`,
  ): LanguageModelV4 {
    const [providerId, modelId] = this.splitId(id, 'languageModel');
    let model = this.getProvider(providerId, 'languageModel').languageModel?.(
      modelId,
    );

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'languageModel' });
    }

    if (this.languageModelMiddleware != null) {
      model = wrapLanguageModel({
        model,
        middleware: this.languageModelMiddleware,
      });
    }

    return model;
  }

  embeddingModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}${SEPARATOR}${string}`,
  ): EmbeddingModelV4 {
    const [providerId, modelId] = this.splitId(id, 'embeddingModel');
    const provider = this.getProvider(providerId, 'embeddingModel');

    const model = provider.embeddingModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({
        modelId: id,
        modelType: 'embeddingModel',
      });
    }

    return model;
  }

  imageModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}${SEPARATOR}${string}`,
  ): ImageModelV4 {
    const [providerId, modelId] = this.splitId(id, 'imageModel');
    const provider = this.getProvider(providerId, 'imageModel');

    let model = provider.imageModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'imageModel' });
    }

    if (this.imageModelMiddleware != null) {
      model = wrapImageModel({
        model,
        middleware: this.imageModelMiddleware,
      });
    }

    return model;
  }

  transcriptionModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}${SEPARATOR}${string}`,
  ): TranscriptionModelV4 {
    const [providerId, modelId] = this.splitId(id, 'transcriptionModel');
    const provider = this.getProvider(providerId, 'transcriptionModel');

    const model = provider.transcriptionModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({
        modelId: id,
        modelType: 'transcriptionModel',
      });
    }

    return model;
  }

  speechModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}${SEPARATOR}${string}`,
  ): SpeechModelV4 {
    const [providerId, modelId] = this.splitId(id, 'speechModel');
    const provider = this.getProvider(providerId, 'speechModel');

    const model = provider.speechModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'speechModel' });
    }

    return model;
  }

  rerankingModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}${SEPARATOR}${string}`,
  ): RerankingModelV4 {
    const [providerId, modelId] = this.splitId(id, 'rerankingModel');
    const provider = this.getProvider(providerId, 'rerankingModel');

    const model = provider.rerankingModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'rerankingModel' });
    }

    return model;
  }

  videoModel<KEY extends keyof PROVIDERS>(
    id: `${KEY & string}${SEPARATOR}${string}`,
  ): Experimental_VideoModelV4 {
    const [providerId, modelId] = this.splitId(id, 'videoModel');
    const provider = this.getProvider(providerId, 'videoModel');

    const model = provider.videoModel?.(modelId);

    if (model == null) {
      throw new NoSuchModelError({ modelId: id, modelType: 'videoModel' });
    }

    return asVideoModelV4(model);
  }

  files<KEY extends keyof PROVIDERS>(id: KEY & string): FilesV4 {
    const provider = this.getProvider(id, 'languageModel');
    const files = provider.files?.();

    if (files == null) {
      throw new Error(
        `The provider "${id}" does not support file uploads. Make sure it exposes a files() method.`,
      );
    }

    return files;
  }

  skills<KEY extends keyof PROVIDERS>(id: KEY & string): SkillsV4 {
    const provider = this.getProvider(id, 'languageModel');
    const skills = provider.skills?.();

    if (skills == null) {
      throw new Error(
        `The provider "${id}" does not support skills. Make sure it exposes a skills() method.`,
      );
    }

    return skills;
  }
}
