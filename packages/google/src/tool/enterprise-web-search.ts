import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

// https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/web-grounding-enterprise

export const enterpriseWebSearch = createProviderExecutedToolFactory<
  {
    // 企业 Web 搜索没有任何输入架构
  },
  {
    // 企业 Web 搜索没有任何输出参数
  },
  {
    // 企业 Web 搜索没有任何配置选项
  }
>({
  id: 'google.enterprise_web_search',
  inputSchema: lazySchema(() => zodSchema(z.object({}))),
  outputSchema: lazySchema(() => zodSchema(z.object({}))),
});
