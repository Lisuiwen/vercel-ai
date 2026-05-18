import type { SharedV2ProviderMetadata } from '../../shared/v2/shared-v2-provider-metadata';

/**
 * 模型生成的工具调用。
 */
export type LanguageModelV2ToolCall = {
  type: 'tool-call';

  /**
   * 工具调用的标识符。它在所有工具调用中必须是唯一的。
   */
  toolCallId: string;

  /**
   * 应调用的工具的名称。
   */
  toolName: string;

  /**
   * 带有工具调用参数的字符串化 JSON 对象。必须匹配
   * 工具的参数架构。
   */
  input: string;

  /**
   * 工具调用是否将由提供者执行。
   * 如果此标志未设置或为 false，则工具调用将由客户端执行。
   */
  providerExecuted?: boolean;

  /**
   * 用于工具调用的其他特定于提供者的元数据。
   */
  providerMetadata?: SharedV2ProviderMetadata;
};
