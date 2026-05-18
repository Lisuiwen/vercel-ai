import type {
  EmbeddingModelV4,
  FilesV4,
  ImageModelV4,
  LanguageModelV4,
  ProviderV4,
  SpeechModelV4,
  SkillsV4,
  TranscriptionModelV4,
} from '@ai-sdk/provider';
import {
  loadApiKey,
  loadOptionalSetting,
  withoutTrailingSlash,
  withUserAgentSuffix,
  type FetchFunction,
} from '@ai-sdk/provider-utils';
import { OpenAIChatLanguageModel } from './chat/openai-chat-language-model';
import type { OpenAIChatModelId } from './chat/openai-chat-language-model-options';
import { OpenAICompletionLanguageModel } from './completion/openai-completion-language-model';
import type { OpenAICompletionModelId } from './completion/openai-completion-language-model-options';
import { OpenAIEmbeddingModel } from './embedding/openai-embedding-model';
import { OpenAIFiles } from './files/openai-files';
import type { OpenAIEmbeddingModelId } from './embedding/openai-embedding-model-options';
import { OpenAIImageModel } from './image/openai-image-model';
import type { OpenAIImageModelId } from './image/openai-image-model-options';
import { openaiTools } from './openai-tools';
import { OpenAIResponsesLanguageModel } from './responses/openai-responses-language-model';
import type { OpenAIResponsesModelId } from './responses/openai-responses-language-model-options';
import { OpenAISpeechModel } from './speech/openai-speech-model';
import type { OpenAISpeechModelId } from './speech/openai-speech-model-options';
import { OpenAITranscriptionModel } from './transcription/openai-transcription-model';
import type { OpenAITranscriptionModelId } from './transcription/openai-transcription-model-options';
import { OpenAISkills } from './skills/openai-skills';
import { VERSION } from './version';

export interface OpenAIProvider extends ProviderV4 {
  (modelId: OpenAIResponsesModelId): LanguageModelV4;

  /**
   * 创建用于文本生成的 OpenAI 模型。
   */
  languageModel(modelId: OpenAIResponsesModelId): LanguageModelV4;

  /**
   * 创建用于文本生成的 OpenAI 聊天模型。
   */
  chat(modelId: OpenAIChatModelId): LanguageModelV4;

  /**
   * 创建用于文本生成的 OpenAI 响应 API 模型。
   */
  responses(modelId: OpenAIResponsesModelId): LanguageModelV4;

  /**
   * 创建用于文本生成的 OpenAI 补全模型。
   */
  completion(modelId: OpenAICompletionModelId): LanguageModelV4;

  /**
   * 创建文本嵌入模型。
   */
  embedding(modelId: OpenAIEmbeddingModelId): EmbeddingModelV4;

  /**
   * 创建文本嵌入模型。
   */
  embeddingModel(modelId: OpenAIEmbeddingModelId): EmbeddingModelV4;

  /**
   * @deprecated 请改用“嵌入”。
   */
  textEmbedding(modelId: OpenAIEmbeddingModelId): EmbeddingModelV4;

  /**
   * @deprecated 请改用“embeddingModel”。
   */
  textEmbeddingModel(modelId: OpenAIEmbeddingModelId): EmbeddingModelV4;

  /**
   * 创建图像生成模型。
   */
  image(modelId: OpenAIImageModelId): ImageModelV4;

  /**
   * 创建图像生成模型。
   */
  imageModel(modelId: OpenAIImageModelId): ImageModelV4;

  /**
   * 创建转录模型。
   */
  transcription(modelId: OpenAITranscriptionModelId): TranscriptionModelV4;

  /**
   * 创建语音生成模型。
   */
  speech(modelId: OpenAISpeechModelId): SpeechModelV4;

  /**
   * 返回一个 FilesV4 接口，用于将文件上传到 OpenAI。
   */
  files(): FilesV4;

  /**
   * 返回 SkillsV4 接口，用于将技能上传到 OpenAI。
   */
  skills(): SkillsV4;

  /**
   * OpenAI 专用工具。
   */
  tools: typeof openaiTools;
}

export interface OpenAIProviderSettings {
  /**
   * OpenAI API 调用的基本 URL。
   */
  baseURL?: string;

  /**
   * 用于验证请求的 API 密钥。
   */
  apiKey?: string;

  /**
   * OpenAI 组织。
   */
  organization?: string;

  /**
   * OpenAI 项目。
   */
  project?: string;

  /**
   * 要包含在请求中的自定义标头。
   */
  headers?: Record<string, string>;

  /**
   * 提供者名称。覆盖第三方提供商的“openai”默认名称。
   */
  name?: string;

  /**
   * 自定义获取实现。您可以将其用作拦截请求的中间件，
   * 或者提供自定义的获取实现，例如测试。
   */
  fetch?: FetchFunction;
}

/**
 * 创建 OpenAI 提供程序实例。
 */
export function createOpenAI(
  options: OpenAIProviderSettings = {},
): OpenAIProvider {
  const baseURL =
    withoutTrailingSlash(
      loadOptionalSetting({
        settingValue: options.baseURL,
        environmentVariableName: 'OPENAI_BASE_URL',
      }),
    ) ?? 'https://api.openai.com/v1';

  const providerName = options.name ?? 'openai';

  const getHeaders = () =>
    withUserAgentSuffix(
      {
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'OPENAI_API_KEY',
          description: 'OpenAI',
        })}`,
        'OpenAI-Organization': options.organization,
        'OpenAI-Project': options.project,
        ...options.headers,
      },
      `ai-sdk/openai/${VERSION}`,
    );

  const createChatModel = (modelId: OpenAIChatModelId) =>
    new OpenAIChatLanguageModel(modelId, {
      provider: `${providerName}.chat`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createCompletionModel = (modelId: OpenAICompletionModelId) =>
    new OpenAICompletionLanguageModel(modelId, {
      provider: `${providerName}.completion`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createEmbeddingModel = (modelId: OpenAIEmbeddingModelId) =>
    new OpenAIEmbeddingModel(modelId, {
      provider: `${providerName}.embedding`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createImageModel = (modelId: OpenAIImageModelId) =>
    new OpenAIImageModel(modelId, {
      provider: `${providerName}.image`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createTranscriptionModel = (modelId: OpenAITranscriptionModelId) =>
    new OpenAITranscriptionModel(modelId, {
      provider: `${providerName}.transcription`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createSpeechModel = (modelId: OpenAISpeechModelId) =>
    new OpenAISpeechModel(modelId, {
      provider: `${providerName}.speech`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createFiles = () =>
    new OpenAIFiles({
      provider: `${providerName}.files`,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createSkills = () =>
    new OpenAISkills({
      provider: `${providerName}.skills`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createLanguageModel = (modelId: OpenAIResponsesModelId) => {
    if (new.target) {
      throw new Error(
        'The OpenAI model function cannot be called with the new keyword.',
      );
    }

    return createResponsesModel(modelId);
  };

  const createResponsesModel = (modelId: OpenAIResponsesModelId) => {
    return new OpenAIResponsesLanguageModel(modelId, {
      provider: `${providerName}.responses`,
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
      // 已软弃用。 TODO：在 v8 中删除
      fileIdPrefixes: ['file-'],
    });
  };

  const provider = function (modelId: OpenAIResponsesModelId) {
    return createLanguageModel(modelId);
  };

  provider.specificationVersion = 'v4' as const;
  provider.languageModel = createLanguageModel;
  provider.chat = createChatModel;
  provider.completion = createCompletionModel;
  provider.responses = createResponsesModel;
  provider.embedding = createEmbeddingModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbedding = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;

  provider.image = createImageModel;
  provider.imageModel = createImageModel;

  provider.transcription = createTranscriptionModel;
  provider.transcriptionModel = createTranscriptionModel;

  provider.speech = createSpeechModel;
  provider.speechModel = createSpeechModel;
  provider.files = createFiles;
  provider.skills = createSkills;

  provider.tools = openaiTools;

  return provider as OpenAIProvider;
}

/**
 * 默认 OpenAI 提供程序实例。
 */
export const openai = createOpenAI();
