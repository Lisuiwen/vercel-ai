import type { JSONValue } from '../../json-value/json-value';

type SpeechModelV2ProviderOptions = Record<string, Record<string, JSONValue>>;

export type SpeechModelV2CallOptions = {
  /**
   * 要转换为语音的文本。
   */
  text: string;

  /**
   * 用于语音合成的语音。
   * 这是特定于提供商的，可以是语音 ID、名称或其他标识符。
   */
  voice?: string;

  /**
   * 所需的音频输出格式，例如“mp3”、“wav”等
   */
  outputFormat?: string;

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
   *   “openai”：{}
   * }
   * ```
   */
  providerOptions?: SpeechModelV2ProviderOptions;

  /**
   * 用于取消操作的中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 与请求一起发送的附加 HTTP 标头。
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: Record<string, string | undefined>;
};
