import type { JSONObject } from '@ai-sdk/provider';
import type { TranscriptionModelResponseMetadata } from '../types/transcription-model-response-metadata';
import type { Warning } from '../types/warning';

/**
 * `transcribe` 调用的结果。
 * 它包含文字记录和附加信息。
 */
export interface TranscriptionResult {
  /**
   * 音频的完整转录文本。
   */
  readonly text: string;

  /**
   * 带有时间信息的转录片段数组。
   * 每个片段代表转录文本的一部分以及开始和结束时间。
   */
  readonly segments: Array<{
    /**
     * 该段的文本内容。
     */
    readonly text: string;
    /**
     * 该段的开始时间（以秒为单位）。
     */
    readonly startSecond: number;
    /**
     * 该段的结束时间（以秒为单位）。
     */
    readonly endSecond: number;
  }>;

  /**
   * 检测到的音频内容的语言，作为 ISO-639-1 代码（例如，“en”表示英语）。
   * 如果无法检测到语言，则可能是未定义的。
   */
  readonly language: string | undefined;

  /**
   * 音频文件的总持续时间（以秒为单位）。
   * 如果无法确定持续时间，则可能是未定义的。
   */
  readonly durationInSeconds: number | undefined;

  /**
   * 通话警告，例如不支持的设置。
   */
  readonly warnings: Array<Warning>;

  /**
   * 来自提供商的响应元数据。如果我们多次调用模型，可能会有多个响应。
   */
  readonly responses: Array<TranscriptionModelResponseMetadata>;

  /**
   * 来自提供商的提供商元数据。
   */
  readonly providerMetadata: Record<string, JSONObject>;
}
