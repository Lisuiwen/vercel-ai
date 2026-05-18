/**
 * 提供者工具的配置。
 *
 * 提供商工具是特定于某个提供商的工具。
 * 输入和输出模式由提供者定义，并且
 * 一些工具也在提供商系统上执行。
 */
export type LanguageModelV3ProviderTool = {
  /**
   * 工具的类型（始终为“提供者”）。
   */
  type: 'provider';

  /**
   * 工具的 ID。应遵循格式“<provider-id>.<unique-tool-name>”。
   */
  id: `${string}.${string}`;

  /**
   * 工具的名称。在该模型调用中是独一无二的。
   */
  name: string;

  /**
   * 用于配置工具的参数。必须匹配提供者为此工具定义的预期参数。
   */
  args: Record<string, unknown>;
};
