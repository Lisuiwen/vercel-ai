/**
 * 由generateText 和streamText 返回的类型化工具调用。
 * 它包含工具调用 ID、工具名称和工具参数。
 */
export interface ToolCall<NAME extends string, INPUT> {
  /**
   * 工具调用的 ID。该 ID 用于将工具调用与工具结果进行匹配。
   */
  toolCallId: string;

  /**
   * 正在调用的工具的名称。
   */
  toolName: NAME;

  /**
   * 工具调用的参数。这是一个与工具的输入架构匹配的 JSON 可序列化对象。
   */
  input: INPUT;

  /**
   * 工具调用是否将由提供者执行。
   * 如果此标志未设置或为 false，则工具调用将由客户端执行。
   */
  providerExecuted?: boolean;

  /**
   * 该工具是否是动态的。
   */
  dynamic?: boolean;
}
