import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const webFetch_20260209ArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      maxUses: z.number().optional(),
      allowedDomains: z.array(z.string()).optional(),
      blockedDomains: z.array(z.string()).optional(),
      citations: z.object({ enabled: z.boolean() }).optional(),
      maxContentTokens: z.number().optional(),
    }),
  ),
);

export const webFetch_20260209OutputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      type: z.literal('web_fetch_result'),
      url: z.string(),
      content: z.object({
        type: z.literal('document'),
        title: z.string().nullable(),
        citations: z.object({ enabled: z.boolean() }).optional(),
        source: z.union([
          z.object({
            type: z.literal('base64'),
            mediaType: z.literal('application/pdf'),
            data: z.string(),
          }),
          z.object({
            type: z.literal('text'),
            mediaType: z.literal('text/plain'),
            data: z.string(),
          }),
        ]),
      }),
      retrievedAt: z.string().nullable(),
    }),
  ),
);

const webFetch_20260209InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      url: z.string(),
    }),
  ),
);

const factory = createProviderExecutedToolFactory<
  {
    /**
     * 要获取的 URL。
     */
    url: string;
  },
  {
    type: 'web_fetch_result';

    /**
     * 获取的内容 URL
     */
    url: string;

    /**
     * 已获取内容。
     */
    content: {
      type: 'document';

      /**
       * 文件标题
       */
      title: string | null;

      /**
       * 文档的引文配置
       */
      citations?: { enabled: boolean };

      source:
        | {
            type: 'base64';
            mediaType: 'application/pdf';
            data: string;
          }
        | {
            type: 'text';
            mediaType: 'text/plain';
            data: string;
          };
    };

    /**
     * 检索内容时的 ISO 8601 时间戳
     */
    retrievedAt: string | null;
  },
  {
    /**
     * maxUses 参数限制执行的 Web 获取次数
     */
    maxUses?: number;

    /**
     * 仅从这些域获取
     */
    allowedDomains?: string[];

    /**
     * 切勿从这些域获取
     */
    blockedDomains?: string[];

    /**
     * 与始终启用引文的网络搜索不同，引文是可选的
     * 网络获取。设置 "itations": {"enabled": true} 以使 Claude 能够引用特定段落
     * 从获取的文档中。
     */
    citations?: {
      enabled: boolean;
    };

    /**
     * maxContentTokens 参数限制将包含在上下文中的内容量。
     */
    maxContentTokens?: number;
  }
>({
  id: 'anthropic.web_fetch_20260209',
  inputSchema: webFetch_20260209InputSchema,
  outputSchema: webFetch_20260209OutputSchema,
  supportsDeferredResults: true,
});

export const webFetch_20260209 = (
  args: Parameters<typeof factory>[0] = {}, // 默认
) => {
  return factory(args);
};
