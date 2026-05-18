import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export type OpenAIEmbeddingModelId =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002'
  | (string & {});

export const openaiEmbeddingModelOptions = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 生成的输出嵌入应具有的维度数。
       * 仅在 text-embedding-3 及更高版本中受支持。
       */
      dimensions: z.number().optional(),

      /**
       * 代表您的最终用户的唯一标识符，可以帮助 OpenAI
       * 监控和发现滥用行为。了解更多。
       */
      user: z.string().optional(),
    }),
  ),
);

export type OpenAIEmbeddingModelOptions = InferSchema<
  typeof openaiEmbeddingModelOptions
>;
