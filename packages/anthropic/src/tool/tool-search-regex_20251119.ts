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
export const toolSearchRegex_20251119OutputSchema = lazySchema(() =>
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
 * 基于正则表达式的工具搜索的输入架构。
 * Claude 使用 Python 的 re.search() 语法构建正则表达式模式。
 */
const toolSearchRegex_20251119InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 用于搜索工具的正则表达式模式。
       * 使用 Python re.search() 语法。最多 200 个字符。
       *
       * 示例：
       * - “天气” - 匹配包含“天气”的工具名称/描述
       * - “get_.*_data” - 匹配 get_user_data、get_weather_data 等工具
       * - “database.*query|query.*database” - OR 模式以实现灵活性
       * - “(?i)slack” - 不区分大小写的搜索
       */
      pattern: z.string(),
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
     * 用于搜索工具的正则表达式模式。
     * 使用 Python re.search() 语法。最多 200 个字符。
     *
     * 示例：
     * - “天气” - 匹配包含“天气”的工具名称/描述
     * - “get_.*_data” - 匹配 get_user_data、get_weather_data 等工具
     * - “database.*query|query.*database” - OR 模式以实现灵活性
     * - “(?i)slack” - 不区分大小写的搜索
     */
    pattern: string;
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
  id: 'anthropic.tool_search_regex_20251119',
  inputSchema: toolSearchRegex_20251119InputSchema,
  outputSchema: toolSearchRegex_20251119OutputSchema,
  supportsDeferredResults: true,
});

/**
 * 创建一个使用正则表达式模式来查找工具的工具搜索工具。
 *
 * 工具搜索工具使 Claude 能够使用数百或数千种工具
 * 通过动态发现并按需加载它们。而不是加载全部
 * 工具定义预先放入上下文窗口中，Claude 搜索您的工具
 * 目录并仅加载所需的工具。
 *
 * 当 Claude 使用此工具时，它使用 Python 构建正则表达式模式
 * re.search() 语法（不是自然语言查询）。
 *
 * **重要**：此工具不应在providerOptions 中包含“deferLoading: true”。
 *
 * @example
 * ````ts
 * 从'@ai-sdk/anthropic'导入{anthropicTools}；
 *
 * 常量工具= {
 *   工具搜索：anthropicTools.toolSearchRegex_20251119(),
 *   // 其他带有 deferLoading 的工具...
 * };
 * ```
 *
 * @see https://docs.anthropic.com/en/docs/agents-and-tools/tool-search-tool
 */
export const toolSearchRegex_20251119 = (
  args: Parameters<typeof factory>[0] = {},
) => {
  return factory(args);
};
