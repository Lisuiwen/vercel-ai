import type { JSONObject } from '@ai-sdk/provider';
import {
  detectMediaType,
  withUserAgentSuffix,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { NoSpeechGeneratedError } from '../error/no-speech-generated-error';
import { logWarnings } from '../logger/log-warnings';
import { resolveSpeechModel } from '../model/resolve-model';
import type { SpeechModel } from '../types/speech-model';
import type { SpeechModelResponseMetadata } from '../types/speech-model-response-metadata';
import type { Warning } from '../types/warning';
import { prepareRetries } from '../util/prepare-retries';
import { VERSION } from '../version';
import type { SpeechResult } from './generate-speech-result';
import {
  DefaultGeneratedAudioFile,
  type GeneratedAudioFile,
} from './generated-audio-file';
/**
 * 使用语音模型生成语音音频。
 *
 * @param model - The speech model to use.
 * @param text - The text to convert to speech.
 * @param voice - The voice to use for speech generation.
 * @param outputFormat - The output format to use for speech generation e.g. "mp3", "wav", etc.
 * @param instructions - Instructions for the speech generation e.g. "Speak in a slow and steady tone".
 * @param speed - The speed of the speech generation.
 * @param language - The language for speech generation (ISO 639-1 code e.g. "en", "es", "fr") or "auto" for automatic detection.
 * @param providerOptions - Additional provider-specific options that are passed through to the provider
 * 作为身体参数。
 * @param maxRetries - Maximum number of retries. Set to 0 to disable retries. Default: 2.
 * @param abortSignal - An optional abort signal that can be used to cancel the call.
 * @param headers - Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
 *
 * @returns A result object that contains the generated audio data.
 */
export async function generateSpeech({
  model,
  text,
  voice,
  outputFormat,
  instructions,
  speed,
  language,
  providerOptions = {},
  maxRetries: maxRetriesArg,
  abortSignal,
  headers,
}: {
  /**
   * 要使用的语音模型。
   */
  model: SpeechModel;

  /**
   * 要转换为语音的文本。
   */
  text: string;

  /**
   * 用于语音生成的语音。
   */
  voice?: string;

  /**
   * 所需的音频输出格式，例如“mp3”、“wav”等
   */
  outputFormat?: 'mp3' | 'wav' | (string & {});

  /**
   * 语音生成的说明，例如“用缓慢而稳定的语气说话”。
   */
  instructions?: string;

  /**
   * 语音生成的速度。
   */
  speed?: number;

  /**
   * 用于语音生成的语言。这应该是 ISO 639-1 语言代码（例如“en”、“es”、“fr”）
   * 或“auto”用于自动语言检测。提供商的支持各不相同。
   */
  language?: string;

  /**
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   *
   * 外部记录以提供者名称为键，内部记录以提供者名称为键
   * 记录由特定于提供者的元数据密钥作为密钥。
   * ````ts
   * {
   * “openai”：{}
   * }
   * ```
   */
  providerOptions?: ProviderOptions;

  /**
   * 每个语音模型调用的最大重试次数。设置为 0 以禁用重试。
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
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: Record<string, string>;
}): Promise<SpeechResult> {
  const resolvedModel = resolveSpeechModel(model);
  if (!resolvedModel) {
    throw new Error('Model could not be resolved');
  }

  const headersWithUserAgent = withUserAgentSuffix(
    headers ?? {},
    `ai/${VERSION}`,
  );

  const { retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal,
  });

  const result = await retry(() =>
    resolvedModel.doGenerate({
      text,
      voice,
      outputFormat,
      instructions,
      speed,
      language,
      abortSignal,
      headers: headersWithUserAgent,
      providerOptions,
    }),
  );

  if (!result.audio || result.audio.length === 0) {
    throw new NoSpeechGeneratedError({ responses: [result.response] });
  }

  logWarnings({
    warnings: result.warnings,
    provider: resolvedModel.provider,
    model: resolvedModel.modelId,
  });

  return new DefaultSpeechResult({
    audio: new DefaultGeneratedAudioFile({
      data: result.audio,
      mediaType:
        detectMediaType({
          data: result.audio,
          topLevelType: 'audio',
        }) ?? 'audio/mp3',
    }),
    warnings: result.warnings,
    responses: [result.response],
    providerMetadata: result.providerMetadata,
  });
}

class DefaultSpeechResult implements SpeechResult {
  readonly audio: GeneratedAudioFile;
  readonly warnings: Array<Warning>;
  readonly responses: Array<SpeechModelResponseMetadata>;
  readonly providerMetadata: Record<string, JSONObject>;

  constructor(options: {
    audio: GeneratedAudioFile;
    warnings: Array<Warning>;
    responses: Array<SpeechModelResponseMetadata>;
    providerMetadata: Record<string, JSONObject> | undefined;
  }) {
    this.audio = options.audio;
    this.warnings = options.warnings;
    this.responses = options.responses;
    this.providerMetadata = options.providerMetadata ?? {};
  }
}
