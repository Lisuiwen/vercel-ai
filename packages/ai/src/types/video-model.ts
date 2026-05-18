import type {
  Experimental_VideoModelV3,
  Experimental_VideoModelV4,
  SharedV4ProviderMetadata,
} from '@ai-sdk/provider';

/**
 * 视频模型可以是字符串（模型ID）或视频模型对象。
 */
export type VideoModel =
  | string
  | Experimental_VideoModelV4
  | Experimental_VideoModelV3;

export type VideoModelProviderMetadata = SharedV4ProviderMetadata;
