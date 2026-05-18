import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';

/**
 * 模型生成的工具调用。
 */
export type LanguageModelV4ToolCall = {
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
   * 该工具是否是动态的，即在运行时定义。
   * 例如，由提供商执行的MCP（模型上下文协议）工具。
   */
  dynamic?: boolean;

  /**
   * 用于工具调用的其他特定于提供者的元数据。
   */
  providerMetadata?: SharedV4ProviderMetadata;
};
