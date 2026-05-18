import type {
  EmbeddingModelV4,
  Experimental_VideoModelV4,
  FilesV4,
  ImageModelV4,
  LanguageModelV4,
  ProviderV4,
} from '@ai-sdk/provider';
import {
  generateId,
  loadApiKey,
  withoutTrailingSlash,
  withUserAgentSuffix,
  type FetchFunction,
} from '@ai-sdk/provider-utils';
import { VERSION } from './version';
import { GoogleEmbeddingModel } from './google-embedding-model';
import type { GoogleEmbeddingModelId } from './google-embedding-model-options';
import { GoogleLanguageModel } from './google-language-model';
import type { GoogleModelId } from './google-language-model-options';
import { googleTools } from './google-tools';

import type {
  GoogleImageSettings,
  GoogleImageModelId,
} from './google-image-settings';
import { GoogleImageModel } from './google-image-model';
import { GoogleFiles } from './google-files';
import { GoogleVideoModel } from './google-video-model';
import type { GoogleVideoModelId } from './google-video-settings';
import {
  GoogleInteractionsLanguageModel,
  type GoogleInteractionsModelInput,
} from './interactions/google-interactions-language-model';
import type { GoogleInteractionsModelId } from './interactions/google-interactions-language-model-options';
import type { GoogleInteractionsAgentName } from './interactions/google-interactions-agent';

export interface GoogleProvider extends ProviderV4 {
  (modelId: GoogleModelId): LanguageModelV4;

  languageModel(modelId: GoogleModelId): LanguageModelV4;

  chat(modelId: GoogleModelId): LanguageModelV4;

  /**
   * 创建图像生成模型。
   */
  image(
    modelId: GoogleImageModelId,
    settings?: GoogleImageSettings,
  ): ImageModelV4;

  /**
   * @deprecated 请改用“chat()”。
   */
  generativeAI(modelId: GoogleModelId): LanguageModelV4;

  /**
   * 创建文本嵌入模型。
   */
  embedding(modelId: GoogleEmbeddingModelId): EmbeddingModelV4;

  /**
   * 创建文本嵌入模型。
   */
  embeddingModel(modelId: GoogleEmbeddingModelId): EmbeddingModelV4;

  /**
   * @deprecated 请改用“嵌入”。
   */
  textEmbedding(modelId: GoogleEmbeddingModelId): EmbeddingModelV4;

  /**
   * @deprecated 请改用“embeddingModel”。
   */
  textEmbeddingModel(modelId: GoogleEmbeddingModelId): EmbeddingModelV4;

  /**
   * 创建视频生成模型。
   */
  video(modelId: GoogleVideoModelId): Experimental_VideoModelV4;

  /**
   * 创建视频生成模型。
   */
  videoModel(modelId: GoogleVideoModelId): Experimental_VideoModelV4;

  files(): FilesV4;

  /**
   * 创建针对 Gemini Interactions API 的语言模型
   * （`POST /v1beta/交互`）。传递模型 ID（字符串）或
   * `{ agent: <name> }` 使用 Gemini 代理预设。
   */
  interactions(
    modelIdOrAgent:
      | GoogleInteractionsModelId
      | { agent: GoogleInteractionsAgentName },
  ): LanguageModelV4;

  tools: typeof googleTools;
}

export interface GoogleProviderSettings {
  /**
   * 对 API 调用使用不同的 URL 前缀，例如使用代理服务器。
   * 默认前缀是“https://generativelanguage.googleapis.com/v1beta”。
   */
  baseURL?: string;

  /**
   * 使用“x-goog-api-key”标头发送的 API 密钥。
   * 它默认为“GOOGLE_GENERATIVE_AI_API_KEY”环境变量。
   */
  apiKey?: string;

  /**
   * 要包含在请求中的自定义标头。
   */
  headers?: Record<string, string | undefined>;

  /**
   * 自定义获取实现。您可以将其用作拦截请求的中间件，
   * 或者提供自定义的获取实现，例如测试。
   */
  fetch?: FetchFunction;

  /**
   * 为每个请求生成唯一 ID 的可选函数。
   */
  generateId?: () => string;

  /**
   * 自定义提供商名称
   * 默认为“google.generative-ai”。
   */
  name?: string;
}

/**
 * 创建一个 Google 提供程序实例。
 */
export function createGoogle(
  options: GoogleProviderSettings = {},
): GoogleProvider {
  const baseURL =
    withoutTrailingSlash(options.baseURL) ??
    'https://generativelanguage.googleapis.com/v1beta';

  const providerName = options.name ?? 'google.generative-ai';

  const getHeaders = () =>
    withUserAgentSuffix(
      {
        'x-goog-api-key': loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'GOOGLE_GENERATIVE_AI_API_KEY',
          description: 'Google Generative AI',
        }),
        ...options.headers,
      },
      `ai-sdk/google/${VERSION}`,
    );

  const createChatModel = (modelId: GoogleModelId) =>
    new GoogleLanguageModel(modelId, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      generateId: options.generateId ?? generateId,
      supportedUrls: () => ({
        '*': [
          // Google 生成语言“文件”端点
          // 例如https://generativelanguage.googleapis.com/v1beta/files/...
          new RegExp(`^${baseURL}/files/.*$`),
          // YouTube URL（公开或不公开的视频）
          new RegExp(
            `^https://(?:www\\.)?youtube\\.com/watch\\?v=[\\w-]+(?:&[\\w=&.-]*)?$`,
          ),
          new RegExp(`^https://youtu\\.be/[\\w-]+(?:\\?[\\w=&.-]*)?$`),
        ],
      }),
      fetch: options.fetch,
    });

  const createEmbeddingModel = (modelId: GoogleEmbeddingModelId) =>
    new GoogleEmbeddingModel(modelId, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createImageModel = (
    modelId: GoogleImageModelId,
    settings: GoogleImageSettings = {},
  ) =>
    new GoogleImageModel(modelId, settings, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createFiles = () =>
    new GoogleFiles({
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createVideoModel = (modelId: GoogleVideoModelId) =>
    new GoogleVideoModel(modelId, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
      generateId: options.generateId ?? generateId,
    });

  const createInteractionsModel = (
    modelIdOrAgent:
      | GoogleInteractionsModelId
      | { agent: GoogleInteractionsAgentName },
  ) =>
    new GoogleInteractionsLanguageModel(
      modelIdOrAgent as GoogleInteractionsModelInput,
      {
        provider: `${providerName}.interactions`,
        baseURL,
        headers: getHeaders,
        generateId: options.generateId ?? generateId,
        fetch: options.fetch,
      },
    );

  const provider = function (modelId: GoogleModelId) {
    if (new.target) {
      throw new Error(
        'The Google Generative AI model function cannot be called with the new keyword.',
      );
    }

    return createChatModel(modelId);
  };

  provider.specificationVersion = 'v4' as const;
  provider.languageModel = createChatModel;
  provider.chat = createChatModel;
  provider.generativeAI = createChatModel;
  provider.embedding = createEmbeddingModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbedding = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.image = createImageModel;
  provider.imageModel = createImageModel;
  provider.video = createVideoModel;
  provider.videoModel = createVideoModel;
  provider.files = createFiles;
  provider.interactions = createInteractionsModel;
  provider.tools = googleTools;

  return provider as GoogleProvider;
}

/**
 * 默认 Google Generative AI 提供程序实例。
 */
export const google = createGoogle();
