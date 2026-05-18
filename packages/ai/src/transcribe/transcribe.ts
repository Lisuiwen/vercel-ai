import type { JSONObject } from '@ai-sdk/provider';
import {
  detectMediaType,
  withUserAgentSuffix,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { NoTranscriptGeneratedError } from '../error/no-transcript-generated-error';
import { logWarnings } from '../logger/log-warnings';
import type { DataContent } from '../prompt';
import { convertDataContentToUint8Array } from '../prompt/data-content';
import type { TranscriptionModel } from '../types/transcription-model';
import type { TranscriptionModelResponseMetadata } from '../types/transcription-model-response-metadata';
import { createDownload } from '../util/download/create-download';
import { prepareRetries } from '../util/prepare-retries';
import type { TranscriptionResult } from './transcribe-result';
import { VERSION } from '../version';
import { resolveTranscriptionModel } from '../model/resolve-model';
import type { Warning } from '../types';
/**
 * 使用转录模型生成转录本。
 *
 * @param model - 要使用的转录模型。
 * @param audio - 要转录为 DataContent (string | Uint8Array | ArrayBuffer | Buffer) 或 URL 的音频数据。
 * @param providerOptions - 传递给提供商的其他特定于提供商的选项
 * 作为身体参数。
 * @param maxRetries - 最大重试次数。设置为 0 以禁用重试。默认值：2。
 * @param abortSignal - 可用于取消调用的可选中止信号。
 * @param headers - 与请求一起发送的附加 HTTP 标头。仅适用于基于 HTTP 的提供商。
 *
 * @returns 包含生成的转录本的结果对象。
 */
const defaultDownload = createDownload();

export async function transcribe({
  model,
  audio,
  providerOptions = {},
  maxRetries: maxRetriesArg,
  abortSignal,
  headers,
  download: downloadFn = defaultDownload,
}: {
  /**
   * 要使用的转录模型。
   */
  model: TranscriptionModel;

  /**
   * 要转录的音频数据。
   */
  audio: DataContent | URL;

  /**
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   *
   * 外部记录以提供者名称为键，内部记录以提供者名称为键
   * 记录由特定于提供者的元数据密钥作为密钥。
   * ````ts
   * {
   *   “开放”：{
   *     “温度”：0
   *   }
   * }
   * ```
   */
  providerOptions?: ProviderOptions;

  /**
   * 每个转录模型调用的最大重试次数。设置为 0 以禁用重试。
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
   * 用于从URL获取音频的自定义下载功能。
   * 使用`ai`中的`createDownload()`具有创建自定义大小限制的下载函数。
   *
   * @default createDownload() (2 GiB limit)
   */
  download?: (options: {
    url: URL;
    abortSignal?: AbortSignal;
  }) => Promise<{ data: Uint8Array; mediaType: string | undefined }>;
}): Promise<TranscriptionResult> {
  const resolvedModel = resolveTranscriptionModel(model);
  if (!resolvedModel) {
    throw new Error('Model could not be resolved');
  }

  const { retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal,
  });

  const headersWithUserAgent = withUserAgentSuffix(
    headers ?? {},
    `ai/${VERSION}`,
  );

  const audioData =
    audio instanceof URL
      ? (await downloadFn({ url: audio, abortSignal })).data
      : convertDataContentToUint8Array(audio);

  const result = await retry(() =>
    resolvedModel.doGenerate({
      audio: audioData,
      abortSignal,
      headers: headersWithUserAgent,
      providerOptions,
      mediaType:
        detectMediaType({
          data: audioData,
          topLevelType: 'audio',
        }) ?? 'audio/wav',
    }),
  );

  logWarnings({
    warnings: result.warnings,
    provider: resolvedModel.provider,
    model: resolvedModel.modelId,
  });

  if (!result.text) {
    throw new NoTranscriptGeneratedError({ responses: [result.response] });
  }

  return new DefaultTranscriptionResult({
    text: result.text,
    segments: result.segments,
    language: result.language,
    durationInSeconds: result.durationInSeconds,
    warnings: result.warnings,
    responses: [result.response],
    providerMetadata: result.providerMetadata,
  });
}

class DefaultTranscriptionResult implements TranscriptionResult {
  readonly text: string;
  readonly segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  readonly language: string | undefined;
  readonly durationInSeconds: number | undefined;
  readonly warnings: Array<Warning>;
  readonly responses: Array<TranscriptionModelResponseMetadata>;
  readonly providerMetadata: Record<string, JSONObject>;

  constructor(options: {
    text: string;
    segments: Array<{
      text: string;
      startSecond: number;
      endSecond: number;
    }>;
    language: string | undefined;
    durationInSeconds: number | undefined;
    warnings: Array<Warning>;
    responses: Array<TranscriptionModelResponseMetadata>;
    providerMetadata: Record<string, JSONObject> | undefined;
  }) {
    this.text = options.text;
    this.segments = options.segments;
    this.language = options.language;
    this.durationInSeconds = options.durationInSeconds;
    this.warnings = options.warnings;
    this.responses = options.responses;
    this.providerMetadata = options.providerMetadata ?? {};
  }
}
