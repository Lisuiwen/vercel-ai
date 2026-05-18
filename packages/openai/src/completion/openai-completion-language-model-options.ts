import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

// https://platform.openai.com/docs/models
export type OpenAICompletionModelId =
  | 'gpt-3.5-turbo-instruct'
  | 'gpt-3.5-turbo-instruct-0914'
  | (string & {});

export const openaiLanguageModelCompletionOptions = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 除了完成之外还回显提示。
       */
      echo: z.boolean().optional(),

      /**
       * 修改指定标记出现在补全中的可能性。
       *
       * 接受映射令牌的 JSON 对象（由它们的令牌 ID 指定）
       * GPT 分词器）转换为从 -100 到 100 的关联偏差值。
       * 可以使用此标记生成器工具将文本转换为标记 ID。从数学上来说，
       * 在采样之前将偏差添加到模型生成的 logits 中。
       * 确切的效果会因模型而异，但值应该在 -1 到 1 之间
       * 减少或增加选择的可能性； -100 或 100 等值
       * 应导致相关代币的禁止或排他性选择。
       *
       * 例如，您可以传递 {"50256": -100} 来防止 <|endoftext|>
       * 令牌被生成。
       */
      logitBias: z.record(z.string(), z.number()).optional(),

      /**
       * 插入文本完成后出现的后缀。
       */
      suffix: z.string().optional(),

      /**
       * 代表您的最终用户的唯一标识符，可以帮助 OpenAI
       * 监控和发现滥用行为。了解更多。
       */
      user: z.string().optional(),

      /**
       * 返回标记的对数概率。包括logprobs会增加
       * 响应大小并可能减慢响应时间。然而，它可以
       * 对于更好地理解模型的行为非常有用。
       * 设置为 true 将返回标记的对数概率
       * 被生成。
       * 设置为数字将返回前 n 个的对数概率
       * 生成的令牌。
       */
      logprobs: z.union([z.boolean(), z.number()]).optional(),
    }),
  ),
);

export type OpenAILanguageModelCompletionOptions = InferSchema<
  typeof openaiLanguageModelCompletionOptions
>;
