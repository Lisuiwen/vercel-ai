import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const webSearch_20250305ArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      maxUses: z.number().optional(),
      allowedDomains: z.array(z.string()).optional(),
      blockedDomains: z.array(z.string()).optional(),
      userLocation: z
        .object({
          type: z.literal('approximate'),
          city: z.string().optional(),
          region: z.string().optional(),
          country: z.string().optional(),
          timezone: z.string().optional(),
        })
        .optional(),
    }),
  ),
);

export const webSearch_20250305OutputSchema = lazySchema(() =>
  zodSchema(
    z.array(
      z.object({
        url: z.string(),
        title: z.string().nullable(),
        pageAge: z.string().nullable(),
        encryptedContent: z.string(),
        type: z.literal('web_search_result'),
      }),
    ),
  ),
);

const webSearch_20250305InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      query: z.string(),
    }),
  ),
);

const factory = createProviderExecutedToolFactory<
  {
    /**
     * 要执行的搜索查询。
     */
    query: string;
  },
  Array<{
    type: 'web_search_result';

    /**
     * 源页面的 URL。
     */
    url: string;

    /**
     * 源页面的标题。
     */
    title: string | null;

    /**
     * 网站上次更新时间
     */
    pageAge: string | null;

    /**
     * 必须在多轮对话中传回以供引用的加密内容
     */
    encryptedContent: string;
  }>,
  {
    /**
     * 对话期间克劳德可以执行的网络搜索的最大数量。
     */
    maxUses?: number;

    /**
     * 允许 Claude 搜索的可选域列表。
     */
    allowedDomains?: string[];

    /**
     * 克劳德在搜索时应避免的可选域列表。
     */
    blockedDomains?: string[];

    /**
     * 可选的用户位置信息以提供地理相关的搜索结果。
     */
    userLocation?: {
      /**
       * 位置类型（必须是近似值）
       */
      type: 'approximate';

      /**
       * 城市名称
       */
      city?: string;

      /**
       * 地区或州
       */
      region?: string;

      /**
       * 国家
       */
      country?: string;

      /**
       * IANA 时区 ID。
       */
      timezone?: string;
    };
  }
>({
  id: 'anthropic.web_search_20250305',
  inputSchema: webSearch_20250305InputSchema,
  outputSchema: webSearch_20250305OutputSchema,
  supportsDeferredResults: true,
});

export const webSearch_20250305 = (
  args: Parameters<typeof factory>[0] = {}, // 默认
) => {
  return factory(args);
};
