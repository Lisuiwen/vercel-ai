import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const webSearchPreviewArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      searchContextSize: z.enum(['low', 'medium', 'high']).optional(),
      userLocation: z
        .object({
          type: z.literal('approximate'),
          country: z.string().optional(),
          city: z.string().optional(),
          region: z.string().optional(),
          timezone: z.string().optional(),
        })
        .optional(),
    }),
  ),
);

export const webSearchPreviewInputSchema = lazySchema(() =>
  zodSchema(z.object({})),
);

const webSearchPreviewOutputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      action: z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('search'),
            query: z.string().optional(),
          }),
          z.object({
            type: z.literal('openPage'),
            url: z.string().nullish(),
          }),
          z.object({
            type: z.literal('findInPage'),
            url: z.string().nullish(),
            pattern: z.string().nullish(),
          }),
        ])
        .optional(),
    }),
  ),
);

export const webSearchPreview = createProviderExecutedToolFactory<
  {
    // 网络搜索预览不接受输入参数 - 它由提示控制
  },
  {
    /**
     * 描述此网络搜索调用中所采取的特定操作的对象。
     * 包括有关模型如何使用网络（搜索、open_page、find_in_page）的详细信息。
     */
    action?:
      | {
          /**
           * 操作类型“搜索”- 执行网络搜索查询。
           */
          type: 'search';

          /**
           * 搜索查询。
           */
          query?: string;
        }
      | {
          /**
           * 操作类型“openPage”- 从搜索结果中打开特定 URL。
           */
          type: 'openPage';

          /**
           * 模型打开的 URL。
           */
          url?: string | null;
        }
      | {
          /**
           * 操作类型“findInPage”：在加载的页面中搜索模式。
           */
          type: 'findInPage';

          /**
           * 搜索模式的页面的 URL。
           */
          url?: string | null;

          /**
           * 要在页面内搜索的模式或文本。
           */
          pattern?: string | null;
        };
  },
  {
    /**
     * 用于网络搜索的搜索上下文大小。
     * - 高：背景最全面，成本最高，响应速度较慢
     * - 中：平衡上下文、成本和延迟（默认）
     * - 低：最少的背景、最低的成本、最快的响应
     */
    searchContextSize?: 'low' | 'medium' | 'high';

    /**
     * 用户位置信息提供与地理相关的搜索结果。
     */
    userLocation?: {
      /**
       * 位置类型（始终为“大约”）
       */
      type: 'approximate';
      /**
       * 两个字母的 ISO 国家/地区代码（例如“US”、“GB”）
       */
      country?: string;
      /**
       * 城市名称（自由文本，例如“明尼阿波利斯”）
       */
      city?: string;
      /**
       * 地区名称（自由文本，例如“明尼苏达”）
       */
      region?: string;
      /**
       * IANA 时区（例如“美国/芝加哥”）
       */
      timezone?: string;
    };
  }
>({
  id: 'openai.web_search_preview',
  inputSchema: webSearchPreviewInputSchema,
  outputSchema: webSearchPreviewOutputSchema,
});
