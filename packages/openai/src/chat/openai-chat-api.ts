import type { JSONSchema7 } from '@ai-sdk/provider';
import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';
import { openaiErrorDataSchema } from '../openai-error';

export interface OpenAIChatFunctionTool {
  type: 'function';
  function: {
    name: string;
    description: string | undefined;
    parameters: JSONSchema7;
    strict?: boolean;
  };
}

export type OpenAIChatToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; function: { name: string } };

// 模式的有限版本，重点关注实现所需的内容
// 这种方法可以限制 API 更改时的损坏并提高效率
export const openaiChatResponseSchema = lazySchema(() =>
  zodSchema(
    z.object({
      id: z.string().nullish(),
      created: z.number().nullish(),
      model: z.string().nullish(),
      choices: z.array(
        z.object({
          message: z.object({
            role: z.literal('assistant').nullish(),
            content: z.string().nullish(),
            tool_calls: z
              .array(
                z.object({
                  id: z.string().nullish(),
                  type: z.literal('function'),
                  function: z.object({
                    name: z.string(),
                    arguments: z.string(),
                  }),
                }),
              )
              .nullish(),
            annotations: z
              .array(
                z.object({
                  type: z.literal('url_citation'),
                  url_citation: z.object({
                    start_index: z.number(),
                    end_index: z.number(),
                    url: z.string(),
                    title: z.string(),
                  }),
                }),
              )
              .nullish(),
          }),
          index: z.number(),
          logprobs: z
            .object({
              content: z
                .array(
                  z.object({
                    token: z.string(),
                    logprob: z.number(),
                    top_logprobs: z.array(
                      z.object({
                        token: z.string(),
                        logprob: z.number(),
                      }),
                    ),
                  }),
                )
                .nullish(),
            })
            .nullish(),
          finish_reason: z.string().nullish(),
        }),
      ),
      usage: z
        .object({
          prompt_tokens: z.number().nullish(),
          completion_tokens: z.number().nullish(),
          total_tokens: z.number().nullish(),
          prompt_tokens_details: z
            .object({
              cached_tokens: z.number().nullish(),
            })
            .nullish(),
          completion_tokens_details: z
            .object({
              reasoning_tokens: z.number().nullish(),
              accepted_prediction_tokens: z.number().nullish(),
              rejected_prediction_tokens: z.number().nullish(),
            })
            .nullish(),
        })
        .nullish(),
    }),
  ),
);

// 模式的有限版本，重点关注实现所需的内容
// 这种方法可以限制 API 更改时的损坏并提高效率
export const openaiChatChunkSchema = lazySchema(() =>
  zodSchema(
    z.union([
      z.object({
        id: z.string().nullish(),
        created: z.number().nullish(),
        model: z.string().nullish(),
        choices: z.array(
          z.object({
            delta: z
              .object({
                role: z.enum(['assistant']).nullish(),
                content: z.string().nullish(),
                tool_calls: z
                  .array(
                    z.object({
                      index: z.number(),
                      id: z.string().nullish(),
                      type: z.literal('function').nullish(),
                      function: z.object({
                        name: z.string().nullish(),
                        arguments: z.string().nullish(),
                      }),
                    }),
                  )
                  .nullish(),
                annotations: z
                  .array(
                    z.object({
                      type: z.literal('url_citation'),
                      url_citation: z.object({
                        start_index: z.number(),
                        end_index: z.number(),
                        url: z.string(),
                        title: z.string(),
                      }),
                    }),
                  )
                  .nullish(),
              })
              .nullish(),
            logprobs: z
              .object({
                content: z
                  .array(
                    z.object({
                      token: z.string(),
                      logprob: z.number(),
                      top_logprobs: z.array(
                        z.object({
                          token: z.string(),
                          logprob: z.number(),
                        }),
                      ),
                    }),
                  )
                  .nullish(),
              })
              .nullish(),
            finish_reason: z.string().nullish(),
            index: z.number(),
          }),
        ),
        usage: z
          .object({
            prompt_tokens: z.number().nullish(),
            completion_tokens: z.number().nullish(),
            total_tokens: z.number().nullish(),
            prompt_tokens_details: z
              .object({
                cached_tokens: z.number().nullish(),
              })
              .nullish(),
            completion_tokens_details: z
              .object({
                reasoning_tokens: z.number().nullish(),
                accepted_prediction_tokens: z.number().nullish(),
                rejected_prediction_tokens: z.number().nullish(),
              })
              .nullish(),
          })
          .nullish(),
      }),
      openaiErrorDataSchema,
    ]),
  ),
);

export type OpenAIChatResponse = InferSchema<typeof openaiChatResponseSchema>;

export type OpenAIChatChunk = InferSchema<typeof openaiChatChunkSchema>;
