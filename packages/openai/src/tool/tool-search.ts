import type { JSONObject } from '@ai-sdk/provider';
import {
  createProviderDefinedToolFactoryWithOutputSchema,
  lazySchema,
  zodSchema,
  type FlexibleSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const toolSearchArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      execution: z.enum(['server', 'client']).optional(),
      description: z.string().optional(),
      parameters: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
);

export const toolSearchInputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      arguments: z.unknown().optional(),
      call_id: z.string().nullish(),
    }),
  ),
);

export const toolSearchOutputSchema: FlexibleSchema<{
  tools: Array<JSONObject>;
}> = lazySchema(() =>
  zodSchema(
    z.object({
      tools: z.array(z.record(z.string(), z.unknown())),
    }),
  ),
) as FlexibleSchema<{ tools: Array<JSONObject> }>;

const toolSearchToolFactory = createProviderDefinedToolFactoryWithOutputSchema<
  {
    /**
     * 来自 tool_search_call 的参数。
     * 这是为了多轮对话重建而保留的。
     */
    arguments?: unknown;

    /**
     * 来自 tool_search_call 的调用 ID。
     * 提供客户端执行的工具搜索；托管为空。
     */
    call_id?: string | null;
  },
  {
    /**
     * 通过工具搜索加载的工具。
     * 这些是模型请求加载的延迟工具。
     * 每个工具都表示为一个 JSON 对象，其属性取决于其类型。
     *
     * 常见属性包括：
     * - `type`：工具的类型（例如，'function'、'web_search' 等）
     * - `name`：工具的名称（对于功能工具）
     * - `description`：工具的描述
     * - `deferLoading`：该工具是否被延迟（有 defer_loading: true）
     * - `parameters`：函数参数的 JSON 模式（对于函数工具）
     * - `strict`：是否启用严格模式遵守（对于函数工具）
     */
    tools: Array<JSONObject>;
  },
  {
    /**
     * 工具搜索是由服务器（托管）还是客户端执行。
     * - “服务器”（默认）：OpenAI 跨延迟工具执行搜索。
     * - “client”：模型发出一个“tool_search_call”和您的“execute”
     *   函数执行查找，返回要加载的工具。
     */
    execution?: 'server' | 'client';

    /**
     * 工具搜索功能的描述。
     * 仅用于客户端执行的工具搜索。
     */
    description?: string;

    /**
     * 应用程序所需的搜索参数的 JSON 架构。
     * 仅用于客户端执行的工具搜索。
     */
    parameters?: Record<string, unknown>;
  }
>({
  id: 'openai.tool_search',
  inputSchema: toolSearchInputSchema,
  outputSchema: toolSearchOutputSchema,
});

export const toolSearch = (
  args: Parameters<typeof toolSearchToolFactory>[0] = {},
) => toolSearchToolFactory(args);
