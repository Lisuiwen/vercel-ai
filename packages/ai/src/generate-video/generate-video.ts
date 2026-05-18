import type {
  Experimental_VideoModelV4,
  Experimental_VideoModelV4CallOptions,
  Experimental_VideoModelV4File,
  SharedV4ProviderMetadata,
} from '@ai-sdk/provider';
import {
  convertBase64ToUint8Array,
  withUserAgentSuffix,
  type DataContent,
  detectMediaType,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { NoVideoGeneratedError } from '../error/no-video-generated-error';
import {
  DefaultGeneratedFile,
  type GeneratedFile,
} from '../generate-text/generated-file';
import { logWarnings } from '../logger/log-warnings';
import { resolveVideoModel } from '../model/resolve-model';
import type { VideoModel } from '../types/video-model';
import type { VideoModelResponseMetadata } from '../types/video-model-response-metadata';
import type { Warning } from '../types/warning';
import { createDownload } from '../util/download/create-download';
import { prepareRetries } from '../util/prepare-retries';
import { VERSION } from '../version';
import type { GenerateVideoResult } from './generate-video-result';
import { splitDataUrl } from '../prompt/split-data-url';

export type GenerateVideoPrompt =
  | string
  | {
      image: DataContent;
      text?: string;
    };

/**
 * 使用视频模型生成视频。
 *
 * @param model - 要使用的视频模型。
 * @param prompt - 应用于生成视频的提示。
 * @param n - 要生成的视频数量。默认值：1。
 * @param aspectRatio - 要生成的视频的宽高比。必须采用`{width}:{height}`格式。
 * @param resolution - 要生成的视频的分辨率。格式必须为`{宽度}x{高度}`。
 * @param duration - 视频的持续时间（以秒为单位）。
 * @param fps - 视频的每秒帧数。
 * @param seed - 视频生成的种子。
 * @param providerOptions - 传递给提供商的其他特定于提供商的选项
 * 作为身体参数。
 * @param maxRetries - 最大重试次数。设置为 0 以禁用重试。默认值：2。
 * @param abortSignal - 可用于取消调用的可选中止信号。
 * @param headers - 与请求一起发送的附加 HTTP 标头。仅适用于基于 HTTP 的提供商。
 *
 * @returns 包含生成的视频的结果对象。
 */
const defaultDownload = createDownload();

export async function experimental_generateVideo({
  model: modelArg,
  prompt: promptArg,
  n = 1,
  maxVideosPerCall,
  aspectRatio,
  resolution,
  duration,
  fps,
  seed,
  providerOptions,
  maxRetries: maxRetriesArg,
  abortSignal,
  headers,
  download: downloadFn = defaultDownload,
}: {
  /**
   * 要使用的视频模型。
   */
  model: VideoModel;

  /**
   * 应用于生成视频的提示。
   */
  prompt: GenerateVideoPrompt;

  /**
   * 要生成的视频数量。
   */
  n?: number;

  /**
   * 每个API调用的最大视频数。如果未提供，将使用模型的默认值。
   */
  maxVideosPerCall?: number;

  /**
   * 要生成的视频的宽高比。必须采用`{width}:{height}`格式。
   */
  aspectRatio?: `${number}:${number}`;

  /**
   * 要生成的视频的分辨率。格式必须为`{宽度}x{}高度`。
   */
  resolution?: `${number}x${number}`;

  /**
   * 视频的持续时间（以秒为单位）。
   */
  duration?: number;

  /**
   * 视频的每秒帧数。
   */
  fps?: number;

  /**
   * 视频生成的种子。
   */
  seed?: number;

  /**
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   */
  providerOptions?: ProviderOptions;

  /**
   * 每个视频模型调用的最大重试次数。设置为 0 以禁用重试。
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
   * 用于从URL获取视频的自定义下载功能。
   * 使用`ai`中的`createDownload()`具有创建自定义大小限制的下载函数。
   *
   * @default createDownload() (2 GiB limit)
   */
  download?: (options: {
    url: URL;
    abortSignal?: AbortSignal;
  }) => Promise<{ data: Uint8Array; mediaType: string | undefined }>;
}): Promise<GenerateVideoResult> {
  const model = resolveVideoModel(modelArg);

  const headersWithUserAgent = withUserAgentSuffix(
    headers ?? {},
    `ai/${VERSION}`,
  );

  const { retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal,
  });

  const { prompt, image } = normalizePrompt(promptArg);

  const maxVideosPerCallWithDefault =
    maxVideosPerCall ?? (await invokeModelMaxVideosPerCall(model)) ?? 1;

  // 并行调用模型：
  const callCount = Math.ceil(n / maxVideosPerCallWithDefault);
  const callVideoCounts = Array.from({ length: callCount }, (_, index) => {
    const remaining = n - index * maxVideosPerCallWithDefault;
    return Math.min(remaining, maxVideosPerCallWithDefault);
  });

  const results = await Promise.all(
    callVideoCounts.map(
      async callVideoCount =>
        await retry(() =>
          model.doGenerate({
            prompt,
            n: callVideoCount,
            aspectRatio,
            resolution,
            duration,
            fps,
            seed,
            image,
            providerOptions: providerOptions ?? {},
            headers: headersWithUserAgent,
            abortSignal,
          } satisfies Experimental_VideoModelV4CallOptions),
        ),
    ),
  );

  // 收集结果视频、警告和响应元数据
  const videos: Array<GeneratedFile> = [];
  const warnings: Array<Warning> = [];
  const responses: Array<VideoModelResponseMetadata> = [];
  const providerMetadata: SharedV4ProviderMetadata = {};

  for (const result of results) {
    for (const videoData of result.videos) {
      switch (videoData.type) {
        case 'url': {
          const { data, mediaType: downloadedMediaType } = await downloadFn({
            url: new URL(videoData.url),
            abortSignal,
          });

          // 过滤掉应进行检测的通用/未知媒体类型
          const isUsableMediaType = (type: string | undefined): boolean =>
            !!type && type !== 'application/octet-stream';

          const mediaType =
            (isUsableMediaType(videoData.mediaType) && videoData.mediaType) ||
            (isUsableMediaType(downloadedMediaType) && downloadedMediaType) ||
            detectMediaType({
              data,
              topLevelType: 'video',
            }) ||
            'video/mp4';

          videos.push(
            new DefaultGeneratedFile({
              data,
              mediaType,
            }),
          );
          break;
        }

        case 'base64': {
          videos.push(
            new DefaultGeneratedFile({
              data: videoData.data,
              mediaType: videoData.mediaType || 'video/mp4',
            }),
          );
          break;
        }

        case 'binary': {
          const mediaType =
            videoData.mediaType ||
            detectMediaType({
              data: videoData.data,
              topLevelType: 'video',
            }) ||
            'video/mp4';

          videos.push(
            new DefaultGeneratedFile({
              data: videoData.data,
              mediaType,
            }),
          );
          break;
        }
      }
    }

    warnings.push(...result.warnings);

    responses.push({
      timestamp: result.response.timestamp,
      modelId: result.response.modelId,
      headers: result.response.headers,
      providerMetadata: result.providerMetadata,
    });

    if (result.providerMetadata != null) {
      for (const [providerName, metadata] of Object.entries(
        result.providerMetadata,
      )) {
        const existingMetadata = providerMetadata[providerName];
        if (existingMetadata != null && typeof existingMetadata === 'object') {
          providerMetadata[providerName] = {
            ...existingMetadata,
            ...metadata,
          };

          // 合并视频数组（如果两者都存在）
          if (
            'videos' in existingMetadata &&
            Array.isArray(existingMetadata.videos) &&
            'videos' in metadata &&
            Array.isArray(metadata.videos)
          ) {
            (providerMetadata[providerName] as { videos: unknown[] }).videos = [
              ...existingMetadata.videos,
              ...metadata.videos,
            ];
          }
        } else {
          providerMetadata[providerName] = metadata;
        }
      }
    }
  }

  if (videos.length === 0) {
    throw new NoVideoGeneratedError({ responses });
  }

  if (warnings.length > 0) {
    logWarnings({
      warnings,
      provider: model.provider,
      model: model.modelId,
    });
  }

  return {
    video: videos[0],
    videos,
    warnings,
    responses,
    providerMetadata,
  };
}

function normalizePrompt(promptArg: GenerateVideoPrompt): {
  prompt: string | undefined;
  image: Experimental_VideoModelV4File | undefined;
} {
  if (typeof promptArg === 'string') {
    return {
      prompt: promptArg,
      image: undefined,
    };
  }

  let image: Experimental_VideoModelV4File | undefined;

  if (promptArg.image != null) {
    const dataContent = promptArg.image;

    if (typeof dataContent === 'string') {
      if (
        dataContent.startsWith('http://') ||
        dataContent.startsWith('https://')
      ) {
        image = {
          type: 'url',
          url: dataContent,
        };
      } else if (dataContent.startsWith('data:')) {
        const { mediaType, base64Content } = splitDataUrl(dataContent);
        image = {
          type: 'file',
          mediaType: mediaType ?? 'image/png',
          data: convertBase64ToUint8Array(base64Content ?? ''),
        };
      } else {
        const bytes = convertBase64ToUint8Array(dataContent);
        const mediaType =
          detectMediaType({
            data: bytes,
            topLevelType: 'image',
          }) ?? 'image/png';

        image = {
          type: 'file',
          mediaType,
          data: bytes,
        };
      }
    } else if (dataContent instanceof Uint8Array) {
      const mediaType =
        detectMediaType({
          data: dataContent,
          topLevelType: 'image',
        }) ?? 'image/png';

      image = {
        type: 'file',
        mediaType,
        data: dataContent,
      };
    }
  }

  return {
    prompt: promptArg.text,
    image,
  };
}

async function invokeModelMaxVideosPerCall(model: Experimental_VideoModelV4) {
  if (typeof model.maxVideosPerCall === 'function') {
    return await model.maxVideosPerCall({ modelId: model.modelId });
  }

  return model.maxVideosPerCall;
}
