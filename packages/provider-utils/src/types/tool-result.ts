/**
 * 由“generateText”和“streamText”返回的类型化工具结果。
 * 它包含工具调用 ID、工具名称、工具参数和工具结果。
 */
export interface ToolResult<NAME extends string, INPUT, OUTPUT> {
  /**
   * 工具调用的 ID。该 ID 用于将工具调用与工具结果进行匹配。
   */
  toolCallId: string;

  /**
   * 调用的工具的名称。
   */
  toolName: NAME;

  /**
   * 工具调用的参数。这是一个与工具的输入架构匹配的 JSON 可序列化对象。
   */
  input: INPUT;

  /**
   * 工具调用的结果。这是该工具的执行结果。
   */
  output: OUTPUT;

  /**
   * 工具结果是否已被提供者执行。
   */
  providerExecuted?: boolean;

  /**
   * 该工具是否是动态的。
   */
  dynamic?: boolean;
}
