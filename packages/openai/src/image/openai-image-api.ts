import { lazySchema, zodSchema } from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

// 架构的最小版本，重点关注实现所需的内容
// 这种方法可以限制 API 更改时的损坏并提高效率
export const openaiImageResponseSchema = lazySchema(() =>
  zodSchema(
    z.object({
      created: z.number().nullish(),
      data: z.array(
        z.object({
          b64_json: z.string(),
          revised_prompt: z.string().nullish(),
        }),
      ),
      background: z.string().nullish(),
      output_format: z.string().nullish(),
      size: z.string().nullish(),
      quality: z.string().nullish(),
      usage: z
        .object({
          input_tokens: z.number().nullish(),
          output_tokens: z.number().nullish(),
          total_tokens: z.number().nullish(),
          input_tokens_details: z
            .object({
              image_tokens: z.number().nullish(),
              text_tokens: z.number().nullish(),
            })
            .nullish(),
        })
        .nullish(),
    }),
  ),
);
