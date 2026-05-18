import type {
  LanguageModelV4FunctionTool,
  LanguageModelV4ProviderTool,
} from '@ai-sdk/provider';

/**
 * 用于自定义工具名称和提供程序工具名称之间映射的接口。
 */
export interface ToolNameMapping {
  /**
   * 将自定义工具名称（由客户端使用）映射到提供者的工具名称。
   * 如果自定义工具名称没有映射，则返回输入名称。
   *
   * @param customToolName - The custom name of the tool defined by the client.
   * @returns The corresponding provider tool name, or the input name if not mapped.
   */
  toProviderToolName: (customToolName: string) => string;

  /**
   * 将提供程序工具名称映射到客户端使用的自定义工具名称。
   * 如果提供程序工具名称没有映射，则返回输入名称。
   *
   * @param providerToolName - The name of the tool as understood by the provider.
   * @returns The corresponding custom tool name, or the input name if not mapped.
   */
  toCustomToolName: (providerToolName: string) => string;
}

/**
 * @param tools - Tools that were passed to the language model.
 * @param providerToolNames - Maps the provider tool ids to the provider tool names.
 */
export function createToolNameMapping({
  tools = [],
  providerToolNames,
}: {
  /**
   * 传递到语言模型的工具。
   */
  tools:
    | Array<LanguageModelV4FunctionTool | LanguageModelV4ProviderTool>
    | undefined;

  /**
   * 将提供程序工具 ID 映射到提供程序工具名称。
   */
  providerToolNames: Record<`${string}.${string}`, string>;
}): ToolNameMapping {
  const customToolNameToProviderToolName: Record<string, string> = {};
  const providerToolNameToCustomToolName: Record<string, string> = {};

  for (const tool of tools) {
    if (tool.type === 'provider' && tool.id in providerToolNames) {
      const providerToolName = providerToolNames[tool.id];
      customToolNameToProviderToolName[tool.name] = providerToolName;
      providerToolNameToCustomToolName[providerToolName] = tool.name;
    }
  }

  return {
    toProviderToolName: (customToolName: string) =>
      customToolNameToProviderToolName[customToolName] ?? customToolName,
    toCustomToolName: (providerToolName: string) =>
      providerToolNameToCustomToolName[providerToolName] ?? providerToolName,
  };
}
