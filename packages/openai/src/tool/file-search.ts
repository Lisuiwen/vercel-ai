import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';
import type {
  OpenAIResponsesFileSearchToolComparisonFilter,
  OpenAIResponsesFileSearchToolCompoundFilter,
} from '../responses/openai-responses-api';

const comparisonFilterSchema = z.object({
  key: z.string(),
  type: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

const compoundFilterSchema: z.ZodType<any> = z.object({
  type: z.enum(['and', 'or']),
  filters: z.array(
    z.union([comparisonFilterSchema, z.lazy(() => compoundFilterSchema)]),
  ),
});

export const fileSearchArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      vectorStoreIds: z.array(z.string()),
      maxNumResults: z.number().optional(),
      ranking: z
        .object({
          ranker: z.string().optional(),
          scoreThreshold: z.number().optional(),
        })
        .optional(),
      filters: z
        .union([comparisonFilterSchema, compoundFilterSchema])
        .optional(),
    }),
  ),
);

export const fileSearchOutputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      queries: z.array(z.string()),
      results: z
        .array(
          z.object({
            attributes: z.record(z.string(), z.unknown()),
            fileId: z.string(),
            filename: z.string(),
            score: z.number(),
            text: z.string(),
          }),
        )
        .nullable(),
    }),
  ),
);

export const fileSearch = createProviderExecutedToolFactory<
  {},
  {
    /**
     * 要执行的搜索查询。
     */
    queries: string[];

    /**
     * 文件搜索工具调用的结果。
     */
    results:
      | null
      | {
          /**
           * 一组可附加到对象的 16 个键值对。
           * 这对于存储有关对象的附加信息非常有用
           * 以结构化格式，并通过 API 或仪表板查询对象。
           * 键是最大长度为 64 个字符的字符串。
           * 值是最大长度为 512 个字符的字符串、布尔值或数字。
           */
          attributes: Record<string, unknown>;

          /**
           * 文件的唯一 ID。
           */
          fileId: string;

          /**
           * 文件的名称。
           */
          filename: string;

          /**
           * 文件的相关性分数 - 0 到 1 之间的值。
           */
          score: number;

          /**
           * 从文件中检索的文本。
           */
          text: string;
        }[];
  },
  {
    /**
     * 要搜索的矢量存储 ID 列表。
     */
    vectorStoreIds: string[];

    /**
     * 返回的搜索结果的最大数量。默认为 10。
     */
    maxNumResults?: number;

    /**
     * 搜索的排名选项。
     */
    ranking?: {
      /**
       * 用于文件搜索的排序器。
       */
      ranker?: string;

      /**
       * 文件搜索的分数阈值，0 到 1 之间的数字。
       * 接近 1 的数字将尝试仅返回最相关的结果，
       * 但可能返回较少的结果。
       */
      scoreThreshold?: number;
    };

    /**
     * 要应用的过滤器。
     */
    filters?:
      | OpenAIResponsesFileSearchToolComparisonFilter
      | OpenAIResponsesFileSearchToolCompoundFilter;
  }
>({
  id: 'openai.file_search',
  inputSchema: z.object({}),
  outputSchema: fileSearchOutputSchema,
});
