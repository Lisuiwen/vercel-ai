import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/**
 * 工具搜索结果的输出架构 - 返回工具引用
 * 由 API 自动扩展为完整的工具定义。
 */
export const toolSearchBm25_20251119OutputSchema = lazySchema(() =>
  zodSchema(
    z.array(
      z.object({
        type: z.literal('tool_reference'),
        toolName: z.string(),
      }),
    ),
  ),
);

/**
 * 基于 BM25 的工具搜索的输入模式。
 * Claude 使用自然语言查询来搜索工具。
 */
const toolSearchBm25_20251119InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 用于搜索工具的自然语言查询。
       * Claude 将使用 BM25 文本搜索来查找相关工具。
       */
      query: z.string(),
      /**
       * 返回的工具的最大数量。选修的。
       */
      limit: z.number().optional(),
    }),
  ),
);

const factory = createProviderExecutedToolFactory<
  {
    /**
     * 用于搜索工具的自然语言查询。
     * Claude 将使用 BM25 文本搜索来查找相关工具。
     */
    query: string;
    /**
     * 返回的工具的最大数量。选修的。
     */
    limit?: number;
  },
  Array<{
    type: 'tool_reference';
    /**
     * 发现的工具的名称。
     */
    toolName: string;
  }>,
  {}
>({
  id: 'anthropic.tool_search_bm25_20251119',
  inputSchema: toolSearchBm25_20251119InputSchema,
  outputSchema: toolSearchBm25_20251119OutputSchema,
  supportsDeferredResults: true,
});

/**
 * 创建一个使用 BM25（自然语言）来查找工具的工具搜索工具。
 *
 * 工具搜索工具使 Claude 能够使用数百或数千种工具
 * 通过动态发现并按需加载它们。而不是加载全部
 * 工具定义预先放入上下文窗口中，Claude 搜索您的工具
 * 目录并仅加载所需的工具。
 *
 * 当 Claude 使用此工具时，它使用自然语言查询（不是正则表达式模式）
 * 使用 BM25 文本搜索来搜索工具。
 *
 * **重要**：此工具不应在providerOptions 中包含“deferLoading: true”。
 *
 * @example
 * ````ts
 * 从'@ai-sdk/anthropic'导入{anthropicTools}；
 *
 * 常量工具= {
 *   工具搜索：anthropicTools.toolSearchBm25_20251119(),
 *   // 其他带有 deferLoading 的工具...
 * };
 * ```
 *
 * @see https://docs.anthropic.com/en/docs/agents-and-tools/tool-search-tool
 */
export const toolSearchBm25_20251119 = (
  args: Parameters<typeof factory>[0] = {},
) => {
  return factory(args);
};
