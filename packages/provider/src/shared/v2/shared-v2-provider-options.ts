import type { JSONValue } from '../../json-value/json-value';

/**
 * 其他特定于提供商的选项。
 * 选项是对提供者的额外输入。
 * 它们从 AI SDK 传递给提供商
 * 并启用特定于提供商的功能
 * 可以完全封装在提供者中。
 *
 * 这使我们能够快速提供提供商特定的功能
 * 不影响核心AI SDK。
 *
 * 外部记录以提供者名称为键，内部记录以提供者名称为键
 * 记录由特定于提供者的元数据密钥作为密钥。
 *
 * ````ts
 * {
 *   “人择”：{
 *     “cacheControl”：{“类型”：“短暂”}
 *   }
 * }
 * ```
 */
export type SharedV2ProviderOptions = Record<string, Record<string, JSONValue>>;
