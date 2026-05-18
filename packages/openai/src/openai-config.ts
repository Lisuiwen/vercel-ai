import type { FetchFunction } from '@ai-sdk/provider-utils';

export type OpenAIConfig = {
  provider: string;
  url: (options: { modelId: string; path: string }) => string;
  headers?: () => Record<string, string | undefined>;
  fetch?: FetchFunction;
  generateId?: () => string;
  /**
   * 这是软弃用的。使用提供程序引用（例如 `{ openai: 'file-abc123' }`）
   * 在文件部分数据中代替。文件 ID 前缀用于标识文件 ID
   * 在响应 API 中。未定义时，所有字符串文件数据都被视为
   * Base64 内容。
   *
   * TODO：在 v8 中删除
   */
  fileIdPrefixes?: readonly string[];
};
