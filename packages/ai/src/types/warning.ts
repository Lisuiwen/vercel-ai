import type { SharedV4Warning } from '@ai-sdk/provider';

/**
 * 来自模型提供商对此调用的警告。呼叫将继续进行，但例如
 * 某些设置可能不受支持，这可能会导致结果不理想。
 */
export type Warning = SharedV4Warning;
