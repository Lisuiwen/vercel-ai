export interface LanguageModelV4ResponseMetadata {
  /**
   * 生成的响应的 ID（如果提供商发送了响应）。
   */
  id?: string;

  /**
   * 生成的响应的开始时间戳（如果提供者发送响应）。
   */
  timestamp?: Date;

  /**
   * 用于生成响应的响应模型的 ID（如果提供者发送了响应模型）。
   */
  modelId?: string;
}
