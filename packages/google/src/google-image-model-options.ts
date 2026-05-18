import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

// 注意：对于 Imagen 3 的首次 GA 发布，安全过滤器不可配置。
// https://ai.google.dev/gemini-api/docs/imagen#imagen-model
export const googleImageModelOptionsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      personGeneration: z
        .enum(['dont_allow', 'allow_adult', 'allow_all'])
        .nullish(),
      aspectRatio: z.enum(['1:1', '3:4', '4:3', '9:16', '16:9']).nullish(),
    }),
  ),
);

export type GoogleImageModelOptions = InferSchema<
  typeof googleImageModelOptionsSchema
>;
