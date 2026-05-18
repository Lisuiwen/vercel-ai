import type { JSONValue } from '../../json-value';
import type { SharedV3ProviderMetadata } from '../../shared/v3/shared-v3-provider-metadata';

/**
 * 提供者执行的工具调用的结果。
 */
export type LanguageModelV3ToolResult = {
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
  result: NonNullable<JSONValue>;

  /**
   * 如果结果是错误或错误消息，则为可选标志。
   */
  isError?: boolean;

  /**
   * 工具结果是否是初步的。
   *
   * 初步工具结果相互替换，例如图像预览。
   * 总是必须有一个最终的、非初步的工具结果。
   *
   * 如果此标志设置为 true，则工具结果是初步的。
   * 如果此标志未设置或为假，则工具结果不是初步的。
   */
  preliminary?: boolean;

  /**
   * 该工具是否是动态的，即在运行时定义。
   * 例如，由提供商执行的MCP（模型上下文协议）工具。
   */
  dynamic?: boolean;

  /**
   * 工具结果的其他特定于提供者的元数据。
   */
  providerMetadata?: SharedV3ProviderMetadata;
};
