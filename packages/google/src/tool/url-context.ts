import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const urlContext = createProviderExecutedToolFactory<
  {
    // url context 没有任何输入模式，它将直接使用提示中的 url
  },
  {},
  {}
>({
  id: 'google.url_context',
  inputSchema: lazySchema(() => zodSchema(z.object({}))),
  outputSchema: lazySchema(() => zodSchema(z.object({}))),
});
