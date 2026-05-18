import type { SharedV2ProviderMetadata } from '../../shared/v2/shared-v2-provider-metadata';

/**
 * 提供者执行的工具调用的结果。
 */
export type LanguageModelV2ToolResult = {
  type: 'tool-result';

  /**
   * 与此结果关联的工具调用的 ID。
   */
  toolCallId: string;

  /**
   * 生成此结果的工具的名称。
   */
  toolName: string;

  /**
   * 工具调用的结果。这是一个 JSON 可序列化对象。
   */
  result: unknown;

  /**
   * 如果结果是错误或错误消息，则为可选标志。
   */
  isError?: boolean;

  /**
   * 工具结果是否由提供商生成。
   * 如果此标志设置为 true，则工具结果由提供者生成。
   * 如果此标志未设置或为 false，则工具结果由客户端生成。
   */
  providerExecuted?: boolean;

  /**
   * 工具结果的其他特定于提供者的元数据。
   */
  providerMetadata?: SharedV2ProviderMetadata;
};
