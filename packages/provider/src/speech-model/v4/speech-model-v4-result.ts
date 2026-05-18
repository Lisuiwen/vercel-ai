import type { JSONObject } from '../../json-value';
import type { SharedV2Headers } from '../../shared';
import type { SharedV4Warning } from '../../shared/v4/shared-v4-warning';

/**
 * 语音模型 doGenerate 调用的结果。
 */
export type SpeechModelV4Result = {
  /**
   * 生成音频作为 ArrayBuffer。
   * 返回音频时应不进行任何不必要的转换。
   * 如果API返回base64编码的字符串，则应返回音频
   * 作为 base64 编码的字符串。如果 API 返回二进制数据，则音频
   * 应作为二进制数据返回。
   */
  audio: string | Uint8Array;

  /**
   * 通话警告，例如不支持的设置。
   */
  warnings: Array<SharedV4Warning>;

  /**
   * 用于遥测和调试目的的可选请求信息。
   */
  request?: {
    /**
     * 响应正文（仅适用于使用 HTTP 请求的提供商）。
     */
    body?: unknown;
  };

  /**
   * 用于遥测和调试目的的响应信息。
   */
  response: {
    /**
     * 生成的响应的开始时间戳。
     */
    timestamp: Date;

    /**
     * 用于生成响应的响应模型的 ID。
     */
    modelId: string;

    /**
     * 响应标头。
     */
    headers?: SharedV2Headers;

    /**
     * 响应体。
     */
    body?: unknown;
  };

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从提供商到 AI SDK 并启用提供商特定的
   * 可以完全封装在提供者中的结果。
   */
  providerMetadata?: Record<string, JSONObject>;
};
