import type { JSONValue } from '../../json-value/json-value';

type TranscriptionModelV2ProviderOptions = Record<
  string,
  Record<string, JSONValue>
>;

export type TranscriptionModelV2CallOptions = {
  /**
   * 要转录的音频数据。
   * 接受`Uint8Array`或`string`，其中`string`是base64编码的音频文件。
   */
  audio: Uint8Array | string;

  /**
   * 音频数据的 IANA 媒体类型。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType: string;

  /**
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   *
   * 外部记录以提供者名称为键，内部记录以提供者名称为键
   * 记录由特定于提供者的元数据密钥作为密钥。
   * ````ts
   * {
   * “开放”：{
   * “时间戳粒度”：[“字”]
   * }
   * }
   * ```
   */
  providerOptions?: TranscriptionModelV2ProviderOptions;

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
