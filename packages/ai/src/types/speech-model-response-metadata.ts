export type SpeechModelResponseMetadata = {
  /**
   * 生成的响应的开始时间戳。
   */
  timestamp: Date;

  /**
   * 用于生成响应的响应模型的ID。
   */
  modelId: string;

  /**
   * 响应标头。
   */
  headers?: Record<string, string>;

  /**
   * 响应体。
   */
  body?: unknown;
};
