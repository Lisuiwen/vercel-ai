/**
 * 由提供商定义的工具的配置。
 */
export type LanguageModelV2ProviderDefinedTool = {
  /**
   * 工具的类型（始终是“提供商定义的”）。
   */
  type: 'provider-defined';

  /**
   * 工具的 ID。应遵循格式“<provider-name>.<unique-tool-name>”。
   */
  id: `${string}.${string}`;

  /**
   * 用户必须在工具集中使用的工具的名称。
   */
  name: string;

  /**
   * 用于配置工具的参数。必须匹配提供者为此工具定义的预期参数。
   */
  args: Record<string, unknown>;
};
