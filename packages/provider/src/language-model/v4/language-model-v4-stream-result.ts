import type { SharedV4Headers } from '../../shared';
import type { LanguageModelV4StreamPart } from './language-model-v4-stream-part';

/**
 * 语言模型 doStream 调用的结果。
 */
export type LanguageModelV4StreamResult = {
  /**
   * 溪流。
   */
  stream: ReadableStream<LanguageModelV4StreamPart>;

  /**
   * 用于遥测和调试目的的可选请求信息。
   */
  request?: {
    /**
     * 请求发送到提供商 API 的 HTTP 正文。
     */
    body?: unknown;
  };

  /**
   * 可选的响应数据。
   */
  response?: {
    /**
     * 响应标头。
     */
    headers?: SharedV4Headers;
  };
};
