import {
  InvalidArgumentError,
  NoSuchModelError,
  type FilesV4,
  type LanguageModelV4,
  type ProviderV4,
  type SkillsV4,
} from '@ai-sdk/provider';
import {
  generateId,
  loadApiKey,
  loadOptionalSetting,
  withoutTrailingSlash,
  withUserAgentSuffix,
  type FetchFunction,
} from '@ai-sdk/provider-utils';
import { AnthropicFiles } from './anthropic-files';
import { AnthropicLanguageModel } from './anthropic-language-model';
import type { AnthropicModelId } from './anthropic-language-model-options';
import { anthropicTools } from './anthropic-tools';
import { AnthropicSkills } from './skills/anthropic-skills';
import { VERSION } from './version';

export interface AnthropicProvider extends ProviderV4 {
  /**
   * 创建文本生成模型。
   */
  (modelId: AnthropicModelId): LanguageModelV4;

  /**
   * 创建文本生成模型。
   */
  languageModel(modelId: AnthropicModelId): LanguageModelV4;

  chat(modelId: AnthropicModelId): LanguageModelV4;

  messages(modelId: AnthropicModelId): LanguageModelV4;

  /**
   * @deprecated 请改用“embeddingModel”。
   */
  textEmbeddingModel(modelId: string): never;

  files(): FilesV4;

  /**
   * 返回 SkillsV4 接口，用于将技能上传到 Anthropic。
   */
  skills(): SkillsV4;

  /**
   * 人类专用的计算机使用工具。
   */
  tools: typeof anthropicTools;
}

export interface AnthropicProviderSettings {
  /**
   * 对 API 调用使用不同的 URL 前缀，例如使用代理服务器。
   * 默认前缀是“https://api.anthropic.com/v1”。
   */
  baseURL?: string;

  /**
   * 使用“x-api-key”标头发送的 API 密钥。
   * 它默认为“ANTHROPIC_API_KEY”环境变量。
   * 仅需要“apiKey”或“authToken”之一。
   */
  apiKey?: string;

  /**
   * 使用“Authorization: Bearer”标头发送的身份验证令牌。
   * 它默认为“ANTHROPIC_AUTH_TOKEN”环境变量。
   * 仅需要“apiKey”或“authToken”之一。
   */
  authToken?: string;

  /**
   * 要包含在请求中的自定义标头。
   */
  headers?: Record<string, string>;

  /**
   * 自定义获取实现。您可以将其用作拦截请求的中间件，
   * 或者提供自定义的获取实现，例如测试。
   */
  fetch?: FetchFunction;

  generateId?: () => string;

  /**
   * 自定义提供商名称
   * 默认为“anthropic.messages”。
   */
  name?: string;
}

/**
 * 创建一个 Anthropic 提供者实例。
 */
export function createAnthropic(
  options: AnthropicProviderSettings = {},
): AnthropicProvider {
  const baseURL =
    withoutTrailingSlash(
      loadOptionalSetting({
        settingValue: options.baseURL,
        environmentVariableName: 'ANTHROPIC_BASE_URL',
      }),
    ) ?? 'https://api.anthropic.com/v1';

  const providerName = options.name ?? 'anthropic.messages';

  // 仅当选项中明确提供两者时才会出错
  if (options.apiKey && options.authToken) {
    throw new InvalidArgumentError({
      argument: 'apiKey/authToken',
      message:
        'Both apiKey and authToken were provided. Please use only one authentication method.',
    });
  }

  const getHeaders = () => {
    const authHeaders: Record<string, string> = options.authToken
      ? { Authorization: `Bearer ${options.authToken}` }
      : {
          'x-api-key': loadApiKey({
            apiKey: options.apiKey,
            environmentVariableName: 'ANTHROPIC_API_KEY',
            description: 'Anthropic',
          }),
        };

    return withUserAgentSuffix(
      {
        'anthropic-version': '2023-06-01',
        ...authHeaders,
        ...options.headers,
      },
      `ai-sdk/anthropic/${VERSION}`,
    );
  };

  const createChatModel = (modelId: AnthropicModelId) =>
    new AnthropicLanguageModel(modelId, {
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
      generateId: options.generateId ?? generateId,
      supportedUrls: () => ({
        'image/*': [/^https?:\/\/.*$/],
        'application/pdf': [/^https?:\/\/.*$/],
      }),
    });

  const createSkills = () =>
    new AnthropicSkills({
      provider: `${providerName.replace('.messages', '')}.skills`,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const provider = function (modelId: AnthropicModelId) {
    if (new.target) {
      throw new Error(
        'The Anthropic model function cannot be called with the new keyword.',
      );
    }

    return createChatModel(modelId);
  };

  provider.specificationVersion = 'v4' as const;
  provider.languageModel = createChatModel;
  provider.chat = createChatModel;
  provider.messages = createChatModel;

  provider.embeddingModel = (modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'embeddingModel' });
  };
  provider.textEmbeddingModel = provider.embeddingModel;
  provider.imageModel = (modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'imageModel' });
  };

  provider.files = () =>
    new AnthropicFiles({
      provider: providerName,
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  provider.skills = createSkills;

  provider.tools = anthropicTools;

  return provider;
}

/**
 * 默认 Anthropic 提供程序实例。
 */
export const anthropic = createAnthropic();
