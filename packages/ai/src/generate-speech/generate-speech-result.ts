import type { JSONObject } from '@ai-sdk/provider';
import type { SpeechModelResponseMetadata } from '../types/speech-model-response-metadata';
import type { Warning } from '../types/warning';
import type { GeneratedAudioFile } from './generated-audio-file';

/**
 * `generateSpeech` 调用的结果。
 * 它包含音频数据和附加信息。
 */
export interface SpeechResult {
  /**
   * 生成的带有音频数据的音频文件。
   */
  readonly audio: GeneratedAudioFile;

  /**
   * 通话警告，例如不支持的设置。
   */
  readonly warnings: Array<Warning>;

  /**
   * 来自提供商的响应元数据。如果我们多次调用模型，可能会有多个响应。
   */
  readonly responses: Array<SpeechModelResponseMetadata>;

  /**
   * 来自提供商的提供商元数据。
   */
  readonly providerMetadata: Record<string, JSONObject>;
}
