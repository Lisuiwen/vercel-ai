import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/* * 从文件搜索存储中检索知识的工具。 */
const fileSearchArgsBaseSchema = z
  .object({
    /** 要从中检索的 file_search_stores 的名称。
     *  示例：“fileSearchStores/my-file-search-store-123”
     */
    fileSearchStoreNames: z
      .array(z.string())
      .describe(
        'The names of the file_search_stores to retrieve from. Example: `fileSearchStores/my-file-search-store-123`',
      ),
    /* * 要检索的文件搜索检索块的数量。 */
    topK: z
      .number()
      .int()
      .positive()
      .describe('The number of file search retrieval chunks to retrieve.')
      .optional(),

    /** 元数据过滤器应用于文件搜索检索文档。
     *  有关过滤器表达式的语法，请参阅 https://google.aip.dev/160。
     */
    metadataFilter: z
      .string()
      .describe(
        'Metadata filter to apply to the file search retrieval documents. See https://google.aip.dev/160 for the syntax of the filter expression.',
      )
      .optional(),
  })
  .passthrough();

export type GoogleFileSearchToolArgs = z.infer<typeof fileSearchArgsBaseSchema>;

export const fileSearch = createProviderExecutedToolFactory<
  {},
  {},
  GoogleFileSearchToolArgs
>({
  id: 'google.file_search',
  inputSchema: lazySchema(() => zodSchema(z.object({}))),
  outputSchema: lazySchema(() => zodSchema(z.object({}))),
});
