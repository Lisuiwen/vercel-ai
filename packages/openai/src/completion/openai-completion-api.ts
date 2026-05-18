import { z } from 'zod/v4';
import { openaiErrorDataSchema } from '../openai-error';
import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
// 模式的有限版本，重点关注实现所需的内容
// 这种方法可以限制 API 更改时的损坏并提高效率
export const openaiCompletionResponseSchema = lazySchema(() =>
  zodSchema(
    z.object({
      id: z.string().nullish(),
      created: z.number().nullish(),
      model: z.string().nullish(),
      choices: z.array(
        z.object({
          text: z.string(),
          finish_reason: z.string(),
          logprobs: z
            .object({
              tokens: z.array(z.string()),
              token_logprobs: z.array(z.number()),
              top_logprobs: z.array(z.record(z.string(), z.number())).nullish(),
            })
            .nullish(),
        }),
      ),
      usage: z
        .object({
          prompt_tokens: z.number(),
          completion_tokens: z.number(),
          total_tokens: z.number(),
        })
        .nullish(),
    }),
  ),
);

// 模式的有限版本，重点关注实现所需的内容
// 这种方法可以限制 API 更改时的损坏并提高效率
export const openaiCompletionChunkSchema = lazySchema(() =>
  zodSchema(
    z.union([
      z.object({
        id: z.string().nullish(),
        created: z.number().nullish(),
        model: z.string().nullish(),
        choices: z.array(
          z.object({
            text: z.string(),
            finish_reason: z.string().nullish(),
            index: z.number(),
            logprobs: z
              .object({
                tokens: z.array(z.string()),
                token_logprobs: z.array(z.number()),
                top_logprobs: z
                  .array(z.record(z.string(), z.number()))
                  .nullish(),
              })
              .nullish(),
          }),
        ),
        usage: z
          .object({
            prompt_tokens: z.number(),
            completion_tokens: z.number(),
            total_tokens: z.number(),
          })
          .nullish(),
      }),
      openaiErrorDataSchema,
    ]),
  ),
);

export type OpenAICompletionChunk = InferSchema<
  typeof openaiCompletionChunkSchema
>;

export type OpenAICompletionResponse = InferSchema<
  typeof openaiCompletionResponseSchema
>;
