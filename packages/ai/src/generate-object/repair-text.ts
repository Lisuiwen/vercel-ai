import type { JSONParseError, TypeValidationError } from '@ai-sdk/provider';

/**
 * 尝试修复模型原始输出的函数
 * 启用JSON解析。
 *
 * 如果文本无法修复，则应返回已修复的文本或 null。
 */
export type RepairTextFunction = (options: {
  text: string;
  error: JSONParseError | TypeValidationError;
}) => Promise<string | null>;
