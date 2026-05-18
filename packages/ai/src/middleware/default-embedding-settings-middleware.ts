import type { EmbeddingModelV4CallOptions } from '@ai-sdk/provider';
import type { EmbeddingModelMiddleware } from '../types';
import { mergeObjects } from '../util/merge-objects';

/**
 * 应用嵌入模型的默认设置。
 */
export function defaultEmbeddingSettingsMiddleware({
  settings,
}: {
  settings: Partial<{
    headers?: EmbeddingModelV4CallOptions['headers'];
    providerOptions?: EmbeddingModelV4CallOptions['providerOptions'];
  }>;
}): EmbeddingModelMiddleware {
  return {
    specificationVersion: 'v4',
    transformParams: async ({ params }) => {
      return mergeObjects(settings, params) as EmbeddingModelV4CallOptions;
    },
  };
}
