import type {
  LanguageModelV4CallOptions,
  SharedV4Warning,
} from '@ai-sdk/provider';
import type {
  GoogleInteractionsTool,
  GoogleInteractionsToolChoice,
} from './google-interactions-prompt';

export type PrepareGoogleInteractionsToolsResult = {
  tools: Array<GoogleInteractionsTool> | undefined;
  toolChoice: GoogleInteractionsToolChoice | undefined;
  toolWarnings: Array<SharedV4Warning>;
};

/**
 * 将 AI SDK 工具定义和“toolChoice”映射到 Gemini Interactions
 * `tools[]` 和 `tool_choice` 请求字段。
 *
 * AI SDK函数工具(`{ type: 'function', name, description, inputSchema }`)
 * 映射到交互`{ type：'function'，名称，描述，参数}`，
 * “参数”作为普通 JSON 模式传递（每个
 * `googleapis/js-genai` `samples/interactions_tool_call_with_functions.ts` 和
 * `src/interactions/resources/interactions.ts` `Function.parameters：未知`）。
 *
 * 提供商定义的工具（`{ type: 'provider', id: 'google.<name>', args }`）
 * 映射到可区分的“工具”联合。全套
 * 此处支持提供者定义的工具 ID：
 *
 * - `google.google_search` -> `{ type: 'google_search', search_types? }`
 * - `google.code_execution` -> `{ 类型：'code_execution' }`
 * - `google.url_context` -> `{ 类型：'url_context' }`
 * - `google.file_search` -> `{ type: 'file_search', file_search_store_names?, top_k?,metadata_filter? }`
 * - `google.google_maps` -> `{ 类型：'google_maps'，纬度？，经度？，enable_widget？ }`
 * - `google.computer_use` -> `{ type: 'computer_use', 环境?, exceptedPredefinedFunctions? }`
 * - `google.mcp_server` -> `{ type: 'mcp_server', name?, url?, headers?, allowed_tools? }`
 * - `google.retrieval` -> `{ type: 'retrieval',retrieval_types?, vertex_ai_search_config? }`
 *
 * `toolChoice` 形状：
 * - `'自动'` -> `'自动'`
 * - `'必需'` -> `'任何'`
 * - `'无'` -> `'无'`
 * - `{ type: 'tool', toolName }` -> `{ allowed_tools: { mode: 'validated', tools: [name] } }`
 *   （交互“AllowedTools.tools”是函数的“Array<string>”
 *   名称，而不是工具描述符 - 请参阅“src/interactions/resources/interactions.ts”
 *   行〜151）。
 */
export function prepareGoogleInteractionsTools({
  tools,
  toolChoice,
}: {
  tools: LanguageModelV4CallOptions['tools'];
  toolChoice?: LanguageModelV4CallOptions['toolChoice'];
}): PrepareGoogleInteractionsToolsResult {
  const toolWarnings: Array<SharedV4Warning> = [];

  const normalized = tools?.length ? tools : undefined;

  if (normalized == null) {
    return { tools: undefined, toolChoice: undefined, toolWarnings };
  }

  const interactionsTools: Array<GoogleInteractionsTool> = [];

  for (const tool of normalized) {
    if (tool.type === 'function') {
      interactionsTools.push({
        type: 'function',
        name: tool.name,
        description: tool.description ?? '',
        parameters: tool.inputSchema,
      });
      continue;
    }

    if (tool.type === 'provider') {
      const args = (tool.args ?? {}) as Record<string, unknown>;
      switch (tool.id) {
        case 'google.google_search': {
          const searchTypesArg = args.searchTypes as
            | { webSearch?: unknown; imageSearch?: unknown }
            | undefined;
          let search_types:
            | Array<'web_search' | 'image_search' | 'enterprise_web_search'>
            | undefined;
          if (searchTypesArg != null && typeof searchTypesArg === 'object') {
            const list: Array<
              'web_search' | 'image_search' | 'enterprise_web_search'
            > = [];
            if (searchTypesArg.webSearch != null) list.push('web_search');
            if (searchTypesArg.imageSearch != null) list.push('image_search');
            if (list.length > 0) {
              search_types = list;
            }
          }
          interactionsTools.push({
            type: 'google_search',
            ...(search_types != null ? { search_types } : {}),
          });
          break;
        }
        case 'google.code_execution': {
          interactionsTools.push({ type: 'code_execution' });
          break;
        }
        case 'google.url_context': {
          interactionsTools.push({ type: 'url_context' });
          break;
        }
        case 'google.file_search': {
          interactionsTools.push({
            type: 'file_search',
            ...(args.fileSearchStoreNames != null
              ? {
                  file_search_store_names:
                    args.fileSearchStoreNames as Array<string>,
                }
              : {}),
            ...(args.topK != null ? { top_k: args.topK as number } : {}),
            ...(args.metadataFilter != null
              ? { metadata_filter: args.metadataFilter as string }
              : {}),
          });
          break;
        }
        case 'google.google_maps': {
          interactionsTools.push({
            type: 'google_maps',
            ...(args.latitude != null
              ? { latitude: args.latitude as number }
              : {}),
            ...(args.longitude != null
              ? { longitude: args.longitude as number }
              : {}),
            ...(args.enableWidget != null
              ? { enable_widget: args.enableWidget as boolean }
              : {}),
          });
          break;
        }
        case 'google.computer_use': {
          interactionsTools.push({
            type: 'computer_use',
            environment:
              (args.environment as 'browser' | undefined) ?? 'browser',
            ...(args.excludedPredefinedFunctions != null
              ? {
                  excludedPredefinedFunctions:
                    args.excludedPredefinedFunctions as Array<string>,
                }
              : {}),
          });
          break;
        }
        case 'google.mcp_server': {
          interactionsTools.push({
            type: 'mcp_server',
            ...(args.name != null ? { name: args.name as string } : {}),
            ...(args.url != null ? { url: args.url as string } : {}),
            ...(args.headers != null
              ? { headers: args.headers as Record<string, string> }
              : {}),
            ...(args.allowedTools != null
              ? { allowed_tools: args.allowedTools as Array<unknown> }
              : {}),
          });
          break;
        }
        case 'google.retrieval': {
          const vertexAiSearchConfig =
            (args.vertexAiSearchConfig as
              | { datastores?: Array<string>; engine?: string }
              | undefined) ?? undefined;
          interactionsTools.push({
            type: 'retrieval',
            ...(args.retrievalTypes != null
              ? {
                  retrieval_types:
                    args.retrievalTypes as Array<'vertex_ai_search'>,
                }
              : { retrieval_types: ['vertex_ai_search'] }),
            ...(vertexAiSearchConfig != null
              ? { vertex_ai_search_config: vertexAiSearchConfig }
              : {}),
          });
          break;
        }
        default: {
          toolWarnings.push({
            type: 'unsupported',
            feature: `provider-defined tool ${tool.id}`,
            details: `provider-defined tool ${tool.id} is not supported by google.interactions; tool dropped.`,
          });
          break;
        }
      }
      continue;
    }

    toolWarnings.push({
      type: 'unsupported',
      feature: `tool of type ${(tool as { type: string }).type}`,
      details:
        'Only function tools and google.* provider-defined tools are supported by google.interactions; tool dropped.',
    });
  }

  /*
   * 交互 API 上的“tool_choice”仅控制函数调用——
   * 当没有“function”工具时，API 拒绝设置“tool_choice”的请求
   * 存在（`{“error”：{“message”：“调用配置的函数设置没有
   * 函数声明。"}}`)。当解析工具时删除`tool_choice`
   * 列表为空或不包含任何功能工具。
   */
  const hasFunctionTool = interactionsTools.some(t => t.type === 'function');

  let mappedToolChoice: GoogleInteractionsToolChoice | undefined;
  if (toolChoice != null && hasFunctionTool) {
    switch (toolChoice.type) {
      case 'auto':
        mappedToolChoice = 'auto';
        break;
      case 'required':
        mappedToolChoice = 'any';
        break;
      case 'none':
        mappedToolChoice = 'none';
        break;
      case 'tool':
        mappedToolChoice = {
          allowed_tools: {
            mode: 'validated',
            tools: [toolChoice.toolName],
          },
        };
        break;
    }
  }

  return {
    tools: interactionsTools.length > 0 ? interactionsTools : undefined,
    toolChoice: mappedToolChoice,
    toolWarnings,
  };
}
