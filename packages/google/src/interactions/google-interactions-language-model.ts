import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4FinishReason,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamResult,
  SharedV4ProviderMetadata,
  SharedV4Warning,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  generateId as defaultGenerateId,
  parseProviderOptions,
  postJsonToApi,
  resolve,
  serializeModelOptions,
  WORKFLOW_DESERIALIZE,
  WORKFLOW_SERIALIZE,
  type FetchFunction,
  type Resolvable,
} from '@ai-sdk/provider-utils';
import { googleFailedResponseHandler } from '../google-error';
import { buildGoogleInteractionsStreamTransform } from './build-google-interactions-stream-transform';
import { convertGoogleInteractionsUsage } from './convert-google-interactions-usage';
import { convertToGoogleInteractionsInput } from './convert-to-google-interactions-input';
import {
  googleInteractionsEventSchema,
  googleInteractionsResponseSchema,
} from './google-interactions-api';
import {
  googleInteractionsLanguageModelOptions,
  type GoogleInteractionsModelId,
} from './google-interactions-language-model-options';
import type {
  GoogleInteractionsAgentConfig,
  GoogleInteractionsGenerationConfig,
  GoogleInteractionsRequestBody,
  GoogleInteractionsResponseFormatEntry,
  GoogleInteractionsTool,
  GoogleInteractionsToolChoice,
} from './google-interactions-prompt';
import { mapGoogleInteractionsFinishReason } from './map-google-interactions-finish-reason';
import { parseGoogleInteractionsOutputs } from './parse-google-interactions-outputs';
import {
  isTerminalStatus,
  pollGoogleInteractionUntilTerminal,
} from './poll-google-interactions';
import { prepareGoogleInteractionsTools } from './prepare-google-interactions-tools';
import { streamGoogleInteractionEvents } from './stream-google-interactions';
import { synthesizeGoogleInteractionsAgentStream } from './synthesize-google-interactions-agent-stream';

export type GoogleInteractionsConfig = {
  provider: string;
  baseURL: string;
  headers?: Resolvable<Record<string, string | undefined>>;
  fetch?: FetchFunction;
  generateId: () => string;
  supportedUrls?: () => LanguageModelV4['supportedUrls'];
};

export type GoogleInteractionsModelInput =
  | GoogleInteractionsModelId
  | { agent: string };

export class GoogleInteractionsLanguageModel implements LanguageModelV4 {
  readonly specificationVersion = 'v4';

  readonly modelId: string;

  /**
   * 可选代理名称。提供后，请求正文将发送“agent:”
   * `model:` 并拒绝 `tools` / ` Generation_config` （警告，而不是抛出）。
   */
  readonly agent: string | undefined;

  private readonly config: GoogleInteractionsConfig;

  static [WORKFLOW_SERIALIZE](model: GoogleInteractionsLanguageModel) {
    return {
      ...serializeModelOptions({
        modelId: model.modelId,
        config: model.config,
      }),
      agent: model.agent,
    };
  }

  static [WORKFLOW_DESERIALIZE](options: {
    modelId: string;
    agent?: string;
    config: GoogleInteractionsConfig;
  }) {
    return new GoogleInteractionsLanguageModel(
      options.agent != null ? { agent: options.agent } : options.modelId,
      options.config,
    );
  }

  constructor(
    modelOrAgent: GoogleInteractionsModelInput,
    config: GoogleInteractionsConfig,
  ) {
    if (typeof modelOrAgent === 'string') {
      this.modelId = modelOrAgent;
      this.agent = undefined;
    } else {
      this.modelId = modelOrAgent.agent;
      this.agent = modelOrAgent.agent;
    }
    this.config = config;
  }

  get provider(): string {
    return this.config.provider;
  }

  get supportedUrls() {
    if (this.config.supportedUrls) {
      return this.config.supportedUrls();
    }
    return {
      'image/*': [/^https?:\/\/.+/],
      'application/pdf': [/^https?:\/\/.+/],
      'audio/*': [/^https?:\/\/.+/],
      'video/*': [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=.+/,
        /^https?:\/\/youtu\.be\/.+/,
        /^gs:\/\/.+/,
      ],
    };
  }

  private async getArgs(options: LanguageModelV4CallOptions) {
    const warnings: Array<SharedV4Warning> = [];

    const opts = await parseProviderOptions({
      provider: 'google',
      providerOptions: options.providerOptions,
      schema: googleInteractionsLanguageModelOptions,
    });

    const isAgent = this.agent != null;

    const hasTools = options.tools != null && options.tools.length > 0;

    let toolsForBody: Array<GoogleInteractionsTool> | undefined;
    let toolChoiceForBody: GoogleInteractionsToolChoice | undefined;

    if (hasTools && isAgent) {
      warnings.push({
        type: 'other',
        message:
          'google.interactions: tools are not supported when an agent is set; tools will be omitted from the request body.',
      });
    } else if (hasTools) {
      const prepared = prepareGoogleInteractionsTools({
        tools: options.tools,
        toolChoice: options.toolChoice,
      });
      toolsForBody = prepared.tools;
      toolChoiceForBody = prepared.toolChoice;
      warnings.push(...prepared.toolWarnings);
    }

    /*
     * `response_format` 是一个多态条目数组。三个来源
     * 贡献，按顺序：
     *
     *   1. AI SDK调用级 `responseFormat: { type: 'json', schema }` →
     *      `{ type: 'text', mime_type: 'application/json', schema }`。
     *   2. `providerOptions.google.responseFormat`（主路径）- 条目
     *      逐字附加camelCase→snake_case翻译。
     *   3. `providerOptions.google.imageConfig`（已弃用的后备）- 仅
     *      如果没有通过以下方式提供“{type:'image'}”条目，则贡献
     *      来源 1 或 2；使用时发出弃用警告。
     *
     * 代理调用无法发送 ` Generation_config` 并且（根据 API）不能
     * 与结构化输出相结合——发出警告并删除该字段。
     */
    const responseFormatEntries: Array<GoogleInteractionsResponseFormatEntry> =
      [];
    if (options.responseFormat?.type === 'json') {
      if (isAgent) {
        warnings.push({
          type: 'other',
          message:
            'google.interactions: structured output (responseFormat) is not supported when an agent is set; responseFormat will be ignored.',
        });
      } else {
        const entry: GoogleInteractionsResponseFormatEntry = {
          type: 'text',
          mime_type: 'application/json',
          ...(options.responseFormat.schema != null
            ? { schema: options.responseFormat.schema }
            : {}),
        };
        responseFormatEntries.push(entry);
      }
    }

    if (opts?.responseFormat != null) {
      for (const entry of opts.responseFormat) {
        if (entry.type === 'text') {
          responseFormatEntries.push(
            pruneUndefined({
              type: 'text' as const,
              mime_type: entry.mimeType ?? undefined,
              schema: entry.schema ?? undefined,
            }),
          );
        } else if (entry.type === 'image') {
          responseFormatEntries.push(
            pruneUndefined({
              type: 'image' as const,
              mime_type: entry.mimeType ?? undefined,
              aspect_ratio: entry.aspectRatio ?? undefined,
              image_size: entry.imageSize ?? undefined,
            }),
          );
        } else if (entry.type === 'audio') {
          responseFormatEntries.push(
            pruneUndefined({
              type: 'audio' as const,
              mime_type: entry.mimeType ?? undefined,
            }),
          );
        }
      }
    }

    const {
      input,
      systemInstruction: convertedSystemInstruction,
      warnings: convWarnings,
    } = convertToGoogleInteractionsInput({
      prompt: options.prompt,
      previousInteractionId: opts?.previousInteractionId ?? undefined,
      store: opts?.store ?? undefined,
      mediaResolution: opts?.mediaResolution ?? undefined,
    });

    warnings.push(...convWarnings);

    let systemInstruction = convertedSystemInstruction;
    const optionSystemInstruction = opts?.systemInstruction ?? undefined;
    if (systemInstruction != null && optionSystemInstruction != null) {
      warnings.push({
        type: 'other',
        message:
          'google.interactions: both AI SDK system message and providerOptions.google.systemInstruction were set; using the AI SDK system message.',
      });
    } else if (systemInstruction == null && optionSystemInstruction != null) {
      systemInstruction = optionSystemInstruction;
    }

    /*
     * Interactions API 将每次调用配置拆分为“ Generation_config ”
     * （模型分支）和 `agent_config` （代理分支）；两者是相辅相成的
     * 独家。 AI SDK调用级生成参数及思考/
     * imageConfig 提供程序选项流入“ Generation_config ”。
     *
     * 设置代理后，API 不接受这些字段。
     * 发出一个列出已删除字段的“LanguageModelV4CallWarning”
     * 命名并继续（不要抛出）；仅限代理的“agent_config”
     * 场取代了它们。
     */
    let generationConfig: GoogleInteractionsGenerationConfig | undefined;
    if (isAgent) {
      const droppedFields: Array<string> = [];
      if (options.temperature != null) droppedFields.push('temperature');
      if (options.topP != null) droppedFields.push('topP');
      if (options.seed != null) droppedFields.push('seed');
      if (options.stopSequences != null && options.stopSequences.length > 0) {
        droppedFields.push('stopSequences');
      }
      if (options.maxOutputTokens != null)
        droppedFields.push('maxOutputTokens');
      if (opts?.thinkingLevel != null) droppedFields.push('thinkingLevel');
      if (opts?.thinkingSummaries != null) {
        droppedFields.push('thinkingSummaries');
      }
      if (opts?.imageConfig != null) droppedFields.push('imageConfig');
      if (droppedFields.length > 0) {
        warnings.push({
          type: 'other',
          message: `google.interactions: ${droppedFields.join(', ')} ${droppedFields.length === 1 ? 'is' : 'are'} not supported when an agent is set; use providerOptions.google.agentConfig instead. Dropped from the request body.`,
        });
      }
      generationConfig = undefined;
    } else {
      generationConfig = pruneUndefined({
        temperature: options.temperature ?? undefined,
        top_p: options.topP ?? undefined,
        seed: options.seed ?? undefined,
        stop_sequences:
          options.stopSequences != null && options.stopSequences.length > 0
            ? options.stopSequences
            : undefined,
        max_output_tokens: options.maxOutputTokens ?? undefined,
        thinking_level: opts?.thinkingLevel ?? undefined,
        thinking_summaries: opts?.thinkingSummaries ?? undefined,
        tool_choice: toolChoiceForBody,
      });

      /*
       * 已弃用的后备路径：“imageConfig”提供图像条目
       * 仅当没有通过“responseFormat”提供时。警告是
       * 当设置 `imageConfig` 时总是发出，以便调用者迁移到
       * `responseFormat` 形状。
       */
      if (opts?.imageConfig != null) {
        const alreadyHasImageEntry = responseFormatEntries.some(
          entry => entry.type === 'image',
        );
        warnings.push({
          type: 'other',
          message: alreadyHasImageEntry
            ? 'google.interactions: providerOptions.google.imageConfig is deprecated and was ignored because providerOptions.google.responseFormat already supplies an image entry. Use responseFormat exclusively.'
            : 'google.interactions: providerOptions.google.imageConfig is deprecated. Use providerOptions.google.responseFormat with a { type: "image", ... } entry instead.',
        });
        if (!alreadyHasImageEntry) {
          responseFormatEntries.push({
            type: 'image',
            mime_type: 'image/png',
            ...(opts.imageConfig.aspectRatio != null
              ? { aspect_ratio: opts.imageConfig.aspectRatio }
              : {}),
            ...(opts.imageConfig.imageSize != null
              ? { image_size: opts.imageConfig.imageSize }
              : {}),
          });
        }
      }
    }

    let agentConfig: GoogleInteractionsAgentConfig | undefined;
    if (isAgent && opts?.agentConfig != null) {
      const ac = opts.agentConfig;
      if (ac.type === 'deep-research') {
        agentConfig = pruneUndefined({
          type: 'deep-research',
          thinking_summaries: ac.thinkingSummaries ?? undefined,
          visualization: ac.visualization ?? undefined,
          collaborative_planning: ac.collaborativePlanning ?? undefined,
        }) as GoogleInteractionsAgentConfig;
      } else if (ac.type === 'dynamic') {
        agentConfig = { type: 'dynamic' };
      }
    }

    /*
     * 代理调用需要线路上的“background: true”——否则 API
     * 拒绝它们，并表示“代理交互需要背景 = true”。
     * 服务器返回非终端状态（`in_progress`/`requires_action`）
     * 最终输出通过“GET /interactions/{id}?stream=true”进行流式传输
     * （或通过“GET /interactions/{id}”进行轮询）。这是在内部处理的
     * `doGenerate` / `doStream` 因此面向用户的表面与
     * 模型 ID 调用。
     *
     * Model-id 调用保留其原始同步行为 - 否
     * 发送“背景”字段。 （没有记录的模型接受“背景：
     * 今天是真的；当有人再次访问时。）
     */
    const args: GoogleInteractionsRequestBody = pruneUndefined({
      ...(isAgent ? { agent: this.agent } : { model: this.modelId }),
      input,
      system_instruction: systemInstruction,
      tools: toolsForBody,
      response_format:
        responseFormatEntries.length > 0 ? responseFormatEntries : undefined,
      response_modalities:
        opts?.responseModalities != null
          ? (opts.responseModalities as Array<
              'text' | 'image' | 'audio' | 'video' | 'document'
            >)
          : undefined,
      previous_interaction_id: opts?.previousInteractionId ?? undefined,
      service_tier: opts?.serviceTier ?? undefined,
      store: opts?.store ?? undefined,
      generation_config:
        generationConfig != null && Object.keys(generationConfig).length > 0
          ? generationConfig
          : undefined,
      agent_config: agentConfig,
      ...(isAgent ? { background: true } : {}),
    });

    return {
      args,
      warnings,
      isAgent,
      pollingTimeoutMs: opts?.pollingTimeoutMs ?? undefined,
    };
  }

  async doGenerate(
    options: LanguageModelV4CallOptions,
  ): Promise<LanguageModelV4GenerateResult> {
    const { args, warnings, isAgent, pollingTimeoutMs } =
      await this.getArgs(options);

    const url = `${this.config.baseURL}/interactions`;

    const mergedHeaders = combineHeaders(
      INTERACTIONS_API_REVISION_HEADER,
      this.config.headers ? await resolve(this.config.headers) : undefined,
      options.headers,
    );

    const postResult = await postJsonToApi({
      url,
      headers: mergedHeaders,
      body: args,
      failedResponseHandler: googleFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        googleInteractionsResponseSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    let {
      responseHeaders,
      value: response,
      rawValue: rawResponse,
    } = postResult;

    /*
     * 代理调用以 `background: true` 运行； POST 立即返回
     * 具有非终端状态（“in_progress”/“requires_action”）。民意调查
     * `GET /interactions/{id}` 直到终端，以便面向用户的表面
     * 匹配同步调用。
     */
    if (isAgent && !isTerminalStatus(response.status)) {
      const polled = await pollGoogleInteractionUntilTerminal({
        baseURL: this.config.baseURL,
        interactionId: response.id,
        headers: mergedHeaders,
        fetch: this.config.fetch,
        abortSignal: options.abortSignal,
        timeoutMs: pollingTimeoutMs,
      });
      response = polled.response;
      rawResponse = polled.rawResponse;
      responseHeaders = polled.responseHeaders ?? responseHeaders;
    }

    /*
     * 当“store: false”（完全无状态模式）时，“response.id”被省略，并且
     * 对于相同的情况，流表面返回 `id: ""` （空字符串）。
     * 将两者标准化为“未定义”，以便下游冲压不会污染
     * 标识符为空/缺失的提供者元数据。
     */
    const interactionId =
      typeof response.id === 'string' && response.id.length > 0
        ? response.id
        : undefined;

    const { content, hasFunctionCall } = parseGoogleInteractionsOutputs({
      steps: response.steps ?? null,
      generateId: this.config.generateId ?? defaultGenerateId,
      interactionId,
    });

    const finishReason: LanguageModelV4FinishReason = {
      unified: mapGoogleInteractionsFinishReason({
        status: response.status,
        hasFunctionCall,
      }),
      raw: response.status,
    };

    /*
     * 服务层差异与`:generateContent`：
     *
     * `google-language-model.ts` 从以下位置读取应用的服务层
     * `x-gemini-service-tier` HTTP 响应标头（请参阅提交 1adfb76d2d）。
     * Interactions API 不会显示该标头；它返回
     * 在响应正文中应用层作为顶层的“service_tier”
     * 交互对象（以及“interaction.complete.interaction”
     * 流式传输）。 `responseHeaders` 参数也被检查为
     * 防御性回退，以防 API 稍后添加标头。
     */
    const serviceTier =
      response.service_tier ??
      responseHeaders?.['x-gemini-service-tier'] ??
      undefined;

    /*
     * 当`store: false`（完全无状态模式）时`response.id`被省略，所以
     * “interactionId”仅在 API 实际返回时才会出现。
     */
    const providerMetadata: SharedV4ProviderMetadata = {
      google: {
        ...(interactionId != null ? { interactionId } : {}),
        ...(serviceTier != null ? { serviceTier } : {}),
      },
    };

    let timestamp: Date | undefined;
    if (typeof response.created === 'string') {
      const parsed = new Date(response.created);
      if (!Number.isNaN(parsed.getTime())) {
        timestamp = parsed;
      }
    }

    return {
      content,
      finishReason,
      usage: convertGoogleInteractionsUsage(response.usage),
      warnings,
      providerMetadata,
      request: { body: args },
      response: {
        headers: responseHeaders,
        body: rawResponse,
        ...(interactionId != null ? { id: interactionId } : {}),
        ...(timestamp ? { timestamp } : {}),
        modelId: response.model ?? undefined,
      },
    };
  }

  async doStream(
    options: LanguageModelV4CallOptions,
  ): Promise<LanguageModelV4StreamResult> {
    const { args, warnings, isAgent, pollingTimeoutMs } =
      await this.getArgs(options);

    const url = `${this.config.baseURL}/interactions`;

    const mergedHeaders = combineHeaders(
      INTERACTIONS_API_REVISION_HEADER,
      this.config.headers ? await resolve(this.config.headers) : undefined,
      options.headers,
    );

    /*
     * 代理调用需要 `background: true`，这与
     * POST 上的“stream: true”。通过 POST 后台 -> GET 流驱动这些
     * （带端子状态短路）。面向用户的流表面
     * 保持相同——文本开始/文本增量/文本结束/完成部分
     * 以与真实 SSE 响应相同的顺序发出。
     */
    if (isAgent) {
      return this.doStreamBackground({
        args,
        warnings,
        url,
        mergedHeaders,
        options,
        pollingTimeoutMs,
      });
    }

    const body = { ...args, stream: true };

    const { responseHeaders, value: response } = await postJsonToApi({
      url,
      headers: mergedHeaders,
      body,
      failedResponseHandler: googleFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        googleInteractionsEventSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    /*
     * Google 的 API 在以下位置展示了应用的服务层：
     * `x-gemini-service-tier` HTTP 响应标头，不在响应正文中。
     * 镜像来自“google-language-model.ts”的规范模式（提交
     * 1adfb76d2d) 并将其通过流转换器进行管道传输，以便“完成”
     * 部分的“providerMetadata.google.serviceTier”来自标头。
     */
    const headerServiceTier = responseHeaders?.['x-gemini-service-tier'];

    const transform = buildGoogleInteractionsStreamTransform({
      warnings,
      generateId: this.config.generateId ?? defaultGenerateId,
      includeRawChunks: options.includeRawChunks,
      serviceTier: headerServiceTier,
    });

    return {
      stream: response.pipeThrough(transform),
      request: { body },
      response: { headers: responseHeaders },
    };
  }

  /*
   * 驱动座席呼叫的流表面。代理商要求
   * `background: true`，与 POST 上的 `stream: true` 不兼容。
   *
   * 方法：
   *   1. 使用“background: true”发布“/interactions”。响应包括
   *      交互 ID 和初始（通常是非终端）状态。
   *   2.如果POST状态已经是terminal（罕见），则合成一个流
   *      从轮询的输出中我们就完成了。
   *   3. 否则打开 `GET /interactions/{id}?stream=true` 并通过管道传输
   *      通过 `buildGoogleInteractionsStreamTransform` 进行 SSE 事件，因此
   *      消费者接收文本增量/思考总结/工具事件作为
   *      它们会在最后发生，而不是一次性全部发生。
   *
   * 当代理在事件之间空闲时，SSE 连接可能会断开
   * (`UND_ERR_BODY_TIMEOUT`); `streamGoogleInteractionEvents` 处理
   * 透明地重新连接“last_event_id”循环。
   */
  private async doStreamBackground({
    args,
    warnings,
    url,
    mergedHeaders,
    options,
    pollingTimeoutMs,
  }: {
    args: GoogleInteractionsRequestBody;
    warnings: Array<SharedV4Warning>;
    url: string;
    mergedHeaders: Record<string, string | undefined>;
    options: LanguageModelV4CallOptions;
    pollingTimeoutMs: number | undefined;
  }): Promise<LanguageModelV4StreamResult> {
    const postResult = await postJsonToApi({
      url,
      headers: mergedHeaders,
      body: args,
      failedResponseHandler: googleFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        googleInteractionsResponseSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const { responseHeaders: postHeaders, value: postResponse } = postResult;
    const interactionId = postResponse.id;

    if (interactionId == null || interactionId.length === 0) {
      throw new Error(
        'google.interactions: background POST response did not include an interaction id; cannot stream the result.',
      );
    }

    const headerServiceTier = postHeaders?.['x-gemini-service-tier'];

    /*
     * 如果 POST 已返回终端状态（例如已缓存、立即
     * 失败，或“不完整”），没有任何内容可以从 GET 中传输——
     * 直接从响应中合成，因此调用者仍然可以获得
     * 完整的流。
     */
    if (isTerminalStatus(postResponse.status)) {
      const synthesized = synthesizeGoogleInteractionsAgentStream({
        response: postResponse,
        warnings,
        generateId: this.config.generateId ?? defaultGenerateId,
        includeRawChunks: options.includeRawChunks,
        headerServiceTier,
      });
      return {
        stream: synthesized,
        request: { body: args },
        response: { headers: postHeaders },
      };
    }

    /*
     * 实时 SSE 路径上未使用“pollingTimeoutMs”——没有轮询
     * 循环超时——但我们将其表面为每次尝试超时
     * AbortSignal 驱动的取消调用者已经控制的。未来
     * 如果 SSE+resume 循环旋转，迭代可能会使用它作为后盾
     * 无限期地。
     */
    void pollingTimeoutMs;

    const events = streamGoogleInteractionEvents({
      baseURL: this.config.baseURL,
      interactionId,
      headers: mergedHeaders,
      fetch: this.config.fetch,
      abortSignal: options.abortSignal,
    });

    const transform = buildGoogleInteractionsStreamTransform({
      warnings,
      generateId: this.config.generateId ?? defaultGenerateId,
      includeRawChunks: options.includeRawChunks,
      serviceTier: headerServiceTier,
    });

    return {
      stream: events.pipeThrough(transform),
      request: { body: args },
      response: { headers: postHeaders },
    };
  }
}

/*
 * 固定 SDK 目标的交互 API 修订版。根据每个请求发送
 * 模型发出模型 ID 调用、代理调用、轮询、SSE 重新连接，
 * 和取消都符合相同的模式。
 */
const INTERACTIONS_API_REVISION_HEADER: Record<string, string> = {
  'Api-Revision': '2026-05-20',
};

function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    result[key] = value;
  }
  return result as T;
}
