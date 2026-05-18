import { lazySchema, zodSchema } from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

// 架构的最小版本，重点关注实现所需的内容
// 这种方法可以限制 API 更改时的损坏并提高效率
export const openaiTextEmbeddingResponseSchema = lazySchema(() =>
  zodSchema(
    z.object({
      data: z.array(z.object({ embedding: z.array(z.number()) })),
      usage: z.object({ prompt_tokens: z.number() }).nullish(),
    }),
  ),
);
