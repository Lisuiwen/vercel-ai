import type {
  ImageModelV4,
  ImageModelV4CallOptions,
  ImageModelV4File,
  ImageModelV4ProviderMetadata,
} from '@ai-sdk/provider';
import {
  convertBase64ToUint8Array,
  detectMediaType,
  withUserAgentSuffix,
  type DataContent,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { NoImageGeneratedError } from '../error/no-image-generated-error';
import {
  DefaultGeneratedFile,
  type GeneratedFile,
} from '../generate-text/generated-file';
import { logWarnings } from '../logger/log-warnings';
import { resolveImageModel } from '../model/resolve-model';
import type { ImageModel } from '../types/image-model';
import type { ImageModelResponseMetadata } from '../types/image-model-response-metadata';
import { addImageModelUsage, type ImageModelUsage } from '../types/usage';
import type { Warning } from '../types/warning';
import { prepareRetries } from '../util/prepare-retries';
import { VERSION } from '../version';
import type { GenerateImageResult } from './generate-image-result';
import { convertDataContentToUint8Array } from '../prompt/data-content';
import { splitDataUrl } from '../prompt/split-data-url';

export type GenerateImagePrompt =
  | string
  | {
      images: Array<DataContent>;
      text?: string;
      mask?: DataContent;
    };

/**
 * 使用图像模型生成图像。
 *
 * @param model - 要使用的图像模型。
 * @param prompt - 应用于生成图像的提示。
 * @param n - 要生成的图像数量。默认值：1。
 * @param maxImagesPerCall - 一次 API 调用中生成的最大图像数。
 * @param size - 要生成的图像的大小。格式必须为`{宽度}x{高度}`。
 * @param aspectRatio - 要生成的图像的长宽比。必须采用`{width}:{height}`格式。
 * @param seed - 图像生成的种子。
 * @param providerOptions - 传递给提供商的其他特定于提供商的选项
 * 作为身体参数。
 * @param maxRetries - 最大重试次数。设置为 0 以禁用重试。默认值：2。
 * @param abortSignal - 可用于取消调用的可选中止信号。
 * @param headers - 与请求一起发送的附加 HTTP 标头。仅适用于基于 HTTP 的提供商。
 *
 * @returns 包含生成图像的结果对象。
 */
export async function generateImage({
  model: modelArg,
  prompt: promptArg,
  n = 1,
  maxImagesPerCall,
  size,
  aspectRatio,
  seed,
  providerOptions,
  maxRetries: maxRetriesArg,
  abortSignal,
  headers,
}: {
  /**
   * 要使用的图像模型。
   */
  model: ImageModel;

  /**
   * 应用于生成图像的提示。
   */
  prompt: GenerateImagePrompt;

  /**
   * 要生成的图像数量。
   */
  n?: number;

  /**
   * 一次API调用中生成的最大图像数。如果未提供，将使用模型的默认值。
   */
  maxImagesPerCall?: number;

  /**
   * 要生成的图像的大小。格式必须为`{宽度}x{高度}`。如果未提供，将使用默认大小。
   */
  size?: `${number}x${number}`;

  /**
   * 要生成图像的长宽比。必须采用`{width}:{height}`格式。如果未提供，将使用默认的宽高比。
   */
  aspectRatio?: `${number}:${number}`;

  /**
   * 图像生成的种子。如果未提供，将使用默认种子。
   */
  seed?: number;

  /**
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   *
   * 外部记录以提供者名称为键，内部记录以提供者名称为键
   * 记录由特定于提供者的元数据密钥作为密钥。
   * ````ts
   * {
   * “开放”：{
   * “风格”：“生动”
   * }
   * }
   * ```
   */
  providerOptions?: ProviderOptions;

  /**
   * 每个图像模型调用的最大重试次数。设置为 0 以禁用重试。
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
}): Promise<GenerateImageResult> {
  const model = resolveImageModel(modelArg);

  const headersWithUserAgent = withUserAgentSuffix(
    headers ?? {},
    `ai/${VERSION}`,
  );

  const { retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal,
  });

  // 如果模型没有指定限制，则默认为 1
  // 一次调用可以生成多少张图像
  const maxImagesPerCallWithDefault =
    maxImagesPerCall ?? (await invokeModelMaxImagesPerCall(model)) ?? 1;

  // 并行调用模型：
  const callCount = Math.ceil(n / maxImagesPerCallWithDefault);
  const callImageCounts = Array.from({ length: callCount }, (_, i) => {
    if (i < callCount - 1) {
      return maxImagesPerCallWithDefault;
    }

    const remainder = n % maxImagesPerCallWithDefault;
    return remainder === 0 ? maxImagesPerCallWithDefault : remainder;
  });

  const results = await Promise.all(
    callImageCounts.map(
      async callImageCount =>
        await retry(() => {
          const { prompt, files, mask } = normalizePrompt(promptArg);

          return model.doGenerate({
            prompt,
            files,
            mask,
            n: callImageCount,
            abortSignal,
            headers: headersWithUserAgent,
            size,
            aspectRatio,
            seed,
            providerOptions: providerOptions ?? {},
          });
        }),
    ),
  );

  // 收集结果图像、警告和响应元数据
  const images: Array<DefaultGeneratedFile> = [];
  const warnings: Array<Warning> = [];
  const responses: Array<ImageModelResponseMetadata> = [];
  const providerMetadata: ImageModelV4ProviderMetadata = {};
  let totalUsage: ImageModelUsage = {
    inputTokens: undefined,
    outputTokens: undefined,
    totalTokens: undefined,
  };
  for (const result of results) {
    images.push(
      ...result.images.map(
        image =>
          new DefaultGeneratedFile({
            data: image,
            mediaType:
              detectMediaType({
                data: image,
                topLevelType: 'image',
              }) ?? 'image/png',
          }),
      ),
    );
    warnings.push(...result.warnings);

    if (result.usage != null) {
      totalUsage = addImageModelUsage(totalUsage, result.usage);
    }

    if (result.providerMetadata) {
      for (const [providerName, metadata] of Object.entries<{
        images: unknown;
      }>(result.providerMetadata)) {
        if (providerName === 'gateway') {
          const currentEntry = providerMetadata[providerName];
          if (currentEntry != null && typeof currentEntry === 'object') {
            providerMetadata[providerName] = {
              ...(currentEntry as object),
              ...metadata,
            } as ImageModelV4ProviderMetadata[string];
          } else {
            providerMetadata[providerName] =
              metadata as ImageModelV4ProviderMetadata[string];
          }
          const imagesValue = (
            providerMetadata[providerName] as { images?: unknown }
          ).images;
          if (Array.isArray(imagesValue) && imagesValue.length === 0) {
            delete (providerMetadata[providerName] as { images?: unknown })
              .images;
          }
        } else {
          providerMetadata[providerName] ??= { images: [] };
          providerMetadata[providerName].images.push(
            ...result.providerMetadata[providerName].images,
          );
        }
      }
    }

    responses.push(result.response);
  }

  logWarnings({ warnings, provider: model.provider, model: model.modelId });

  if (!images.length) {
    throw new NoImageGeneratedError({ responses });
  }

  return new DefaultGenerateImageResult({
    images,
    warnings,
    responses,
    providerMetadata,
    usage: totalUsage,
  });
}

class DefaultGenerateImageResult implements GenerateImageResult {
  readonly images: Array<GeneratedFile>;
  readonly warnings: Array<Warning>;
  readonly responses: Array<ImageModelResponseMetadata>;
  readonly providerMetadata: ImageModelV4ProviderMetadata;
  readonly usage: ImageModelUsage;

  constructor(options: {
    images: Array<GeneratedFile>;
    warnings: Array<Warning>;
    responses: Array<ImageModelResponseMetadata>;
    providerMetadata: ImageModelV4ProviderMetadata;
    usage: ImageModelUsage;
  }) {
    this.images = options.images;
    this.warnings = options.warnings;
    this.responses = options.responses;
    this.providerMetadata = options.providerMetadata;
    this.usage = options.usage;
  }

  get image() {
    return this.images[0];
  }
}

async function invokeModelMaxImagesPerCall(model: ImageModelV4) {
  const isFunction = model.maxImagesPerCall instanceof Function;

  if (!isFunction) {
    return model.maxImagesPerCall;
  }

  return model.maxImagesPerCall({
    modelId: model.modelId,
  });
}

function normalizePrompt(
  prompt: GenerateImagePrompt,
): Pick<ImageModelV4CallOptions, 'prompt' | 'files' | 'mask'> {
  if (typeof prompt === 'string') {
    return { prompt, files: undefined, mask: undefined };
  }

  return {
    prompt: prompt.text,
    files: prompt.images.map(toImageModelV4File),
    mask: prompt.mask ? toImageModelV4File(prompt.mask) : undefined,
  };
}

function toImageModelV4File(dataContent: DataContent): ImageModelV4File {
  if (typeof dataContent === 'string' && dataContent.startsWith('http')) {
    return {
      type: 'url',
      url: dataContent,
    };
  }

  // 处理数据 URL
  if (typeof dataContent === 'string' && dataContent.startsWith('data:')) {
    const { mediaType: dataUrlMediaType, base64Content } =
      splitDataUrl(dataContent);

    if (base64Content != null) {
      const uint8Data = convertBase64ToUint8Array(base64Content);
      return {
        type: 'file',
        data: uint8Data,
        mediaType:
          dataUrlMediaType ||
          detectMediaType({
            data: uint8Data,
            topLevelType: 'image',
          }) ||
          'image/png',
      };
    }
  }

  const uint8Data = convertDataContentToUint8Array(dataContent);
  return {
    type: 'file',
    data: uint8Data,
    mediaType:
      detectMediaType({
        data: uint8Data,
        topLevelType: 'image',
      }) || 'image/png',
  };
}
