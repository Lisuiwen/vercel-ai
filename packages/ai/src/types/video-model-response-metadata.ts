import type { SharedV4ProviderMetadata } from '@ai-sdk/provider';

/**
 * 视频模型调用的响应元数据。
 */
export type VideoModelResponseMetadata = {
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
   * 此调用的提供商特定元数据。
   * 当进行多次调用时 (n > maxVideosPerCall)，每次响应
   * 包含自己的提供者元数据，允许无损的每次调用访问。
   */
  providerMetadata?: SharedV4ProviderMetadata;
};
