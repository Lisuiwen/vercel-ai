import type { SharedV4ProviderReference } from '@ai-sdk/provider';

/**
 * 提供程序名称到提供程序特定的文件标识符的映射。
 *
 * 提供者引用允许跨不同的文件进行识别
 * 通过存储每个提供商自己的内容，无需重新上传
 * 同一逻辑文件的标识符。
 */
export type ProviderReference = SharedV4ProviderReference;
