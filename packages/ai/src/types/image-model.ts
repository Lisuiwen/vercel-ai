import type {
  ImageModelV2,
  ImageModelV3,
  ImageModelV4,
  ImageModelV4ProviderMetadata,
  ImageModelV2ProviderMetadata,
} from '@ai-sdk/provider';

/**
 * AI SDK使用的图像模型。
 */
export type ImageModel = string | ImageModelV4 | ImageModelV3 | ImageModelV2;

/**
 * 来自模型提供者的此调用的元数据。
 */
export type ImageModelProviderMetadata =
  | ImageModelV4ProviderMetadata
  | ImageModelV2ProviderMetadata;
