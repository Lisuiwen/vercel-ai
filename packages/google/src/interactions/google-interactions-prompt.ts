/**
 * Gemini Interactions API 有线格式的内部 TypeScript 类型。
 *
 * 镜像`googleapis/js-genai`中的公共类型：
 * `src/interactions/resources/interactions.ts`。
 */

export type GoogleInteractionsTextContent = {
  type: 'text';
  text: string;
  annotations?: Array<GoogleInteractionsAnnotation | { type: string }>;
};

export type GoogleInteractionsImageContent = {
  type: 'image';
  data?: string;
  mime_type?: string;
  uri?: string;
  resolution?: 'low' | 'medium' | 'high' | 'ultra_high';
};

export type GoogleInteractionsAudioContent = {
  type: 'audio';
  data?: string;
  mime_type?: string;
  uri?: string;
  channels?: number;
  sample_rate?: number;
};

export type GoogleInteractionsDocumentContent = {
  type: 'document';
  data?: string;
  mime_type?: string;
  uri?: string;
};

export type GoogleInteractionsVideoContent = {
  type: 'video';
  data?: string;
  mime_type?: string;
  uri?: string;
  resolution?: 'low' | 'medium' | 'high' | 'ultra_high';
};

export type GoogleInteractionsThoughtSummaryItem =
  | GoogleInteractionsTextContent
  | GoogleInteractionsImageContent;

export type GoogleInteractionsFunctionResultContent = {
  type: 'function_result';
  call_id: string;
  result:
    | string
    | Array<GoogleInteractionsTextContent | GoogleInteractionsImageContent>
    | unknown;
  name?: string;
  is_error?: boolean;
  signature?: string;
};

/**
 * 附加到“文本”内容块的注释类型：
 * - `url_引用` (web) — `url` + 可选的 `title`
 * - `file_itation` — `url` 为引用目标；可选的`document_uri`
 *   / `file_name` 用于文档引用
 * - `place_itation` — 地图接地，带有 `url`
 */
export type GoogleInteractionsURLCitation = {
  type: 'url_citation';
  url?: string;
  title?: string;
  start_index?: number;
  end_index?: number;
};

export type GoogleInteractionsFileCitation = {
  type: 'file_citation';
  file_name?: string;
  document_uri?: string;
  url?: string;
  page_number?: number;
  media_id?: string;
  start_index?: number;
  end_index?: number;
  custom_metadata?: Record<string, unknown>;
};

export type GoogleInteractionsPlaceCitation = {
  type: 'place_citation';
  name?: string;
  url?: string;
  place_id?: string;
  start_index?: number;
  end_index?: number;
  review_snippets?: Array<{
    review_id?: string;
    title?: string;
    url?: string;
  }>;
};

export type GoogleInteractionsAnnotation =
  | GoogleInteractionsURLCitation
  | GoogleInteractionsFileCitation
  | GoogleInteractionsPlaceCitation;

/*
 * --- 阶梯有效载荷形状 ---
 *
 * `function_call`、`thought` 和内置的 `*_call`/`*_result` 是
 * 顶级 **step** 类型 - 它们的字段直接位于步骤对象上
 * （没有“内容”间接）。以下类型对这些有效负载进行建模；步骤
 * 包装器（“类型”鉴别器+有效负载）是“GoogleInteractionsStep”
 * 再往下。
 */

export type GoogleInteractionsFunctionCallStepPayload = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  signature?: string;
};

export type GoogleInteractionsThoughtStepPayload = {
  signature?: string;
  summary?: Array<GoogleInteractionsThoughtSummaryItem>;
};

export type GoogleInteractionsCodeExecutionCallStepPayload = {
  id: string;
  arguments?: { code?: string; language?: string };
  signature?: string;
};

export type GoogleInteractionsCodeExecutionResultStepPayload = {
  call_id: string;
  result?: string;
  is_error?: boolean;
  signature?: string;
};

export type GoogleInteractionsURLContextCallStepPayload = {
  id: string;
  arguments?: { urls?: Array<string> };
  signature?: string;
};

export type GoogleInteractionsURLContextResultEntry = {
  url?: string;
  status?: 'success' | 'error' | 'paywall' | 'unsafe' | string;
};

export type GoogleInteractionsURLContextResultStepPayload = {
  call_id: string;
  result?: Array<GoogleInteractionsURLContextResultEntry>;
  is_error?: boolean;
  signature?: string;
};

export type GoogleInteractionsGoogleSearchCallStepPayload = {
  id: string;
  arguments?: { queries?: Array<string> };
  search_type?: 'web_search' | 'image_search' | 'enterprise_web_search';
  signature?: string;
};

export type GoogleInteractionsGoogleSearchResultEntry = {
  search_suggestions?: string;
  url?: string;
  title?: string;
};

export type GoogleInteractionsGoogleSearchResultStepPayload = {
  call_id: string;
  result?: Array<GoogleInteractionsGoogleSearchResultEntry>;
  is_error?: boolean;
  signature?: string;
};

export type GoogleInteractionsFileSearchCallStepPayload = {
  id: string;
  signature?: string;
};

export type GoogleInteractionsFileSearchResultStepPayload = {
  call_id: string;
  result?: Array<unknown>;
  signature?: string;
};

export type GoogleInteractionsGoogleMapsCallStepPayload = {
  id: string;
  arguments?: { queries?: Array<string> };
  signature?: string;
};

export type GoogleInteractionsGoogleMapsResultPlace = {
  name?: string;
  place_id?: string;
  url?: string;
  review_snippets?: Array<{
    review_id?: string;
    title?: string;
    url?: string;
  }>;
};

export type GoogleInteractionsGoogleMapsResultEntry = {
  places?: Array<GoogleInteractionsGoogleMapsResultPlace>;
  widget_context_token?: string;
};

export type GoogleInteractionsGoogleMapsResultStepPayload = {
  call_id: string;
  result?: Array<GoogleInteractionsGoogleMapsResultEntry>;
  signature?: string;
};

export type GoogleInteractionsMCPServerToolCallStepPayload = {
  id: string;
  name: string;
  server_name: string;
  arguments?: Record<string, unknown>;
  signature?: string;
};

export type GoogleInteractionsMCPServerToolResultStepPayload = {
  call_id: string;
  result?: unknown;
  name?: string;
  server_name?: string;
  signature?: string;
};

/*
 * 可区分的步骤联合 - `response.steps[]` 的元素和
 * “step.start” SSE 事件中的“step”字段。
 */
export type GoogleInteractionsModelOutputStep = {
  type: 'model_output';
  content?: Array<GoogleInteractionsContentBlock>;
};

export type GoogleInteractionsUserInputStep = {
  type: 'user_input';
  content?: Array<GoogleInteractionsContentBlock>;
};

export type GoogleInteractionsFunctionCallStep = {
  type: 'function_call';
} & GoogleInteractionsFunctionCallStepPayload;

export type GoogleInteractionsThoughtStep = {
  type: 'thought';
} & GoogleInteractionsThoughtStepPayload;

export type GoogleInteractionsBuiltinToolCallStep =
  | ({
      type: 'google_search_call';
    } & GoogleInteractionsGoogleSearchCallStepPayload)
  | ({
      type: 'code_execution_call';
    } & GoogleInteractionsCodeExecutionCallStepPayload)
  | ({ type: 'url_context_call' } & GoogleInteractionsURLContextCallStepPayload)
  | ({ type: 'file_search_call' } & GoogleInteractionsFileSearchCallStepPayload)
  | ({ type: 'google_maps_call' } & GoogleInteractionsGoogleMapsCallStepPayload)
  | ({
      type: 'mcp_server_tool_call';
    } & GoogleInteractionsMCPServerToolCallStepPayload);

export type GoogleInteractionsBuiltinToolResultStep =
  | ({
      type: 'google_search_result';
    } & GoogleInteractionsGoogleSearchResultStepPayload)
  | ({
      type: 'code_execution_result';
    } & GoogleInteractionsCodeExecutionResultStepPayload)
  | ({
      type: 'url_context_result';
    } & GoogleInteractionsURLContextResultStepPayload)
  | ({
      type: 'file_search_result';
    } & GoogleInteractionsFileSearchResultStepPayload)
  | ({
      type: 'google_maps_result';
    } & GoogleInteractionsGoogleMapsResultStepPayload)
  | ({
      type: 'mcp_server_tool_result';
    } & GoogleInteractionsMCPServerToolResultStepPayload);

export type GoogleInteractionsStep =
  | GoogleInteractionsUserInputStep
  | GoogleInteractionsModelOutputStep
  | GoogleInteractionsFunctionCallStep
  | GoogleInteractionsThoughtStep
  | GoogleInteractionsBuiltinToolCallStep
  | GoogleInteractionsBuiltinToolResultStep
  | { type: string; [k: string]: unknown };

/*
 * 内部内容块类型（位于“model_output.content[]”内部的内容和
 * `user_input.content[]`）。函数调用、思考和内置工具
 * 调用/结果块是步骤，而不是内容块。
 */
export type GoogleInteractionsContentBlock =
  | GoogleInteractionsTextContent
  | GoogleInteractionsImageContent
  | GoogleInteractionsAudioContent
  | GoogleInteractionsDocumentContent
  | GoogleInteractionsVideoContent
  | GoogleInteractionsFunctionResultContent
  | { type: string; [k: string]: unknown };

/**
 * 为文件部分转换器表面保留的别名；等同于
 * `GoogleInteractionsContentBlock`。
 */
export type GoogleInteractionsContent = GoogleInteractionsContentBlock;

/*
 * “输入”是一系列步骤。单轮用户提示发送为
 * `[{ 类型：'用户输入'，内容：[...] }]`。
 */
export type GoogleInteractionsInput = Array<GoogleInteractionsStep>;

export type GoogleInteractionsTool =
  | {
      type: 'function';
      name?: string;
      description?: string;
      parameters?: unknown;
    }
  | { type: 'code_execution' }
  | { type: 'url_context' }
  | {
      type: 'computer_use';
      environment?: 'browser';
      excludedPredefinedFunctions?: Array<string>;
    }
  | {
      type: 'mcp_server';
      name?: string;
      url?: string;
      headers?: Record<string, string>;
      allowed_tools?: Array<unknown>;
    }
  | {
      type: 'google_search';
      search_types?: Array<
        'web_search' | 'image_search' | 'enterprise_web_search'
      >;
    }
  | {
      type: 'file_search';
      file_search_store_names?: Array<string>;
      metadata_filter?: string;
      top_k?: number;
    }
  | {
      type: 'google_maps';
      enable_widget?: boolean;
      latitude?: number;
      longitude?: number;
    }
  | {
      type: 'retrieval';
      retrieval_types?: Array<'vertex_ai_search'>;
      vertex_ai_search_config?: {
        datastores?: Array<string>;
        engine?: string;
      };
    };

export type GoogleInteractionsToolChoiceType =
  | 'auto'
  | 'any'
  | 'none'
  | 'validated';

export type GoogleInteractionsAllowedToolsConfig = {
  allowed_tools?: {
    mode?: GoogleInteractionsToolChoiceType;
    tools?: Array<string>;
  };
};

export type GoogleInteractionsToolChoice =
  | GoogleInteractionsToolChoiceType
  | GoogleInteractionsAllowedToolsConfig;

export type GoogleInteractionsThinkingLevel =
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high';

export type GoogleInteractionsThinkingSummaries = 'auto' | 'none';

export type GoogleInteractionsResponseModality =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document';

export type GoogleInteractionsServiceTier = 'flex' | 'standard' | 'priority';

export type GoogleInteractionsAspectRatio =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '4:5'
  | '5:4'
  | '9:16'
  | '16:9'
  | '21:9'
  | '1:8'
  | '8:1'
  | '1:4'
  | '4:1';

export type GoogleInteractionsImageSize = '1K' | '2K' | '4K' | '512';

/*
 * `response_format` 是一个多态条目。要求采取多种方式
 * 通过发送条目数组。 SDK 构造的条目：
 *
 *   { type: 'text', mime_type: 'application/json', schema: <JSONSchema> }
 *     -- 结构化输出（JSON 模式）。 `mime_type` 是必需的； `模式`是
 *     可选但推荐。
 *
 *   { 类型：'图像'，mime_type，aspect_ratio？，image_size？ }
 *     ——图像生成。 `mime_type` 默认为 `image/png`。
 */
export type GoogleInteractionsResponseFormatTextEntry = {
  type: 'text';
  mime_type?: string;
  schema?: unknown;
};

export type GoogleInteractionsResponseFormatImageEntry = {
  type: 'image';
  mime_type?: string;
  aspect_ratio?: GoogleInteractionsAspectRatio;
  image_size?: GoogleInteractionsImageSize;
};

export type GoogleInteractionsResponseFormatAudioEntry = {
  type: 'audio';
  mime_type?: string;
};

export type GoogleInteractionsResponseFormatEntry =
  | GoogleInteractionsResponseFormatTextEntry
  | GoogleInteractionsResponseFormatImageEntry
  | GoogleInteractionsResponseFormatAudioEntry;

export type GoogleInteractionsGenerationConfig = {
  temperature?: number;
  top_p?: number;
  seed?: number;
  stop_sequences?: Array<string>;
  max_output_tokens?: number;
  thinking_level?: GoogleInteractionsThinkingLevel;
  thinking_summaries?: GoogleInteractionsThinkingSummaries;
  tool_choice?: GoogleInteractionsToolChoice;
};

export type GoogleInteractionsAgentConfig =
  | { type: 'dynamic'; [k: string]: unknown }
  | {
      type: 'deep-research';
      thinking_summaries?: GoogleInteractionsThinkingSummaries;
      visualization?: 'off' | 'auto';
      collaborative_planning?: boolean;
    };

export type GoogleInteractionsRequestBody = {
  model?: string;
  agent?: string;
  input: GoogleInteractionsInput;
  system_instruction?: string;
  tools?: Array<GoogleInteractionsTool>;
  response_format?: Array<GoogleInteractionsResponseFormatEntry>;
  response_modalities?: Array<GoogleInteractionsResponseModality>;
  generation_config?: GoogleInteractionsGenerationConfig;
  agent_config?: GoogleInteractionsAgentConfig;
  previous_interaction_id?: string;
  service_tier?: GoogleInteractionsServiceTier;
  store?: boolean;
  stream?: boolean;
  /**
   * 在后台运行交互。 POST 立即返回
   * 非最终状态（“in_progress”/“requires_action”）；客户必须
   * 轮询“GET /interactions/{id}”直到终端。
   *
   * 代理调用所需 - API 返回
   * 否则，`background=true 是代理交互所必需的。`未使用
   * 用于模型 ID 调用。
   */
  background?: boolean;
};

export type GoogleInteractionsStatus =
  | 'in_progress'
  | 'requires_action'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'incomplete';

/*
 * 源提取器使用的别名；结构上等同于它们
 * 步进有效负载对应物。
 */
export type GoogleInteractionsBuiltinToolResultContent =
  GoogleInteractionsBuiltinToolResultStep;
export type GoogleInteractionsGoogleSearchResultContent = Extract<
  GoogleInteractionsBuiltinToolResultStep,
  { type: 'google_search_result' }
>;
export type GoogleInteractionsGoogleMapsResultContent = Extract<
  GoogleInteractionsBuiltinToolResultStep,
  { type: 'google_maps_result' }
>;
export type GoogleInteractionsURLContextResultContent = Extract<
  GoogleInteractionsBuiltinToolResultStep,
  { type: 'url_context_result' }
>;
