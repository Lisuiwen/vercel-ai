import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4Content,
  LanguageModelV4FinishReason,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamPart,
  LanguageModelV4StreamResult,
  SharedV4ProviderMetadata,
  SharedV4Warning,
} from '@ai-sdk/provider';
import {
  StreamingToolCallTracker,
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  generateId,
  isCustomReasoning,
  parseProviderOptions,
  postJsonToApi,
  serializeModelOptions,
  WORKFLOW_DESERIALIZE,
  WORKFLOW_SERIALIZE,
  type FetchFunction,
  type ParseResult,
} from '@ai-sdk/provider-utils';
import { openaiFailedResponseHandler } from '../openai-error';
import { getOpenAILanguageModelCapabilities } from '../openai-language-model-capabilities';
import {
  convertOpenAIChatUsage,
  type OpenAIChatUsage,
} from './convert-openai-chat-usage';
import { convertToOpenAIChatMessages } from './convert-to-openai-chat-messages';
import { getResponseMetadata } from './get-response-metadata';
import { mapOpenAIFinishReason } from './map-openai-finish-reason';
import {
  openaiChatChunkSchema,
  openaiChatResponseSchema,
  type OpenAIChatChunk,
} from './openai-chat-api';
import {
  openaiLanguageModelChatOptions,
  type OpenAIChatModelId,
} from './openai-chat-language-model-options';
import { prepareChatTools } from './openai-chat-prepare-tools';

type OpenAIChatConfig = {
  provider: string;
  headers?: () => Record<string, string | undefined>;
  url: (options: { modelId: string; path: string }) => string;
  fetch?: FetchFunction;
};

export class OpenAIChatLanguageModel implements LanguageModelV4 {
  readonly specificationVersion = 'v4';

  readonly modelId: OpenAIChatModelId;

  readonly supportedUrls = {
    'image/*': [/^https?:\/\/.*$/],
  };

  private readonly config: OpenAIChatConfig;

  static [WORKFLOW_SERIALIZE](model: OpenAIChatLanguageModel) {
    return serializeModelOptions({
      modelId: model.modelId,
      config: model.config,
    });
  }

  static [WORKFLOW_DESERIALIZE](options: {
    modelId: OpenAIChatModelId;
    config: OpenAIChatConfig;
  }) {
    return new OpenAIChatLanguageModel(options.modelId, options.config);
  }

  constructor(modelId: OpenAIChatModelId, config: OpenAIChatConfig) {
    this.modelId = modelId;
    this.config = config;
  }

  get provider(): string {
    return this.config.provider;
  }

  private async getArgs({
    prompt,
    maxOutputTokens,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    responseFormat,
    seed,
    tools,
    toolChoice,
    reasoning,
    providerOptions,
  }: LanguageModelV4CallOptions) {
    const warnings: SharedV4Warning[] = [];

    // 解析提供者选项
    const openaiOptions =
      (await parseProviderOptions({
        provider: 'openai',
        providerOptions,
        schema: openaiLanguageModelChatOptions,
      })) ?? {};

    const modelCapabilities = getOpenAILanguageModelCapabilities(this.modelId);

    // AI SDK 推理值直接映射到 OpenAI 推理值。
    const resolvedReasoningEffort =
      openaiOptions.reasoningEffort ??
      (isCustomReasoning(reasoning) ? reasoning : undefined);

    const isReasoningModel =
      openaiOptions.forceReasoning ?? modelCapabilities.isReasoningModel;

    if (topK != null) {
      warnings.push({ type: 'unsupported', feature: 'topK' });
    }

    const { messages, warnings: messageWarnings } = convertToOpenAIChatMessages(
      {
        prompt,
        systemMessageMode:
          openaiOptions.systemMessageMode ??
          (isReasoningModel
            ? 'developer'
            : modelCapabilities.systemMessageMode),
      },
    );

    warnings.push(...messageWarnings);

    const strictJsonSchema = openaiOptions.strictJsonSchema ?? true;

    const baseArgs = {
      // 模型编号：
      model: this.modelId,

      // 模型具体设置：
      logit_bias: openaiOptions.logitBias,
      logprobs:
        openaiOptions.logprobs === true ||
        typeof openaiOptions.logprobs === 'number'
          ? true
          : undefined,
      top_logprobs:
        typeof openaiOptions.logprobs === 'number'
          ? openaiOptions.logprobs
          : typeof openaiOptions.logprobs === 'boolean'
            ? openaiOptions.logprobs
              ? 0
              : undefined
            : undefined,
      user: openaiOptions.user,
      parallel_tool_calls: openaiOptions.parallelToolCalls,

      // 标准化设置：
      max_tokens: maxOutputTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      response_format:
        responseFormat?.type === 'json'
          ? responseFormat.schema != null
            ? {
                type: 'json_schema',
                json_schema: {
                  schema: responseFormat.schema,
                  strict: strictJsonSchema,
                  name: responseFormat.name ?? 'response',
                  description: responseFormat.description,
                },
              }
            : { type: 'json_object' }
          : undefined,
      stop: stopSequences,
      seed,
      verbosity: openaiOptions.textVerbosity,

      // openai具体设置：
      // TODO AI SDK 6：删除，我们现在自动映射 maxOutputTokens
      max_completion_tokens: openaiOptions.maxCompletionTokens,
      store: openaiOptions.store,
      metadata: openaiOptions.metadata,
      prediction: openaiOptions.prediction,
      reasoning_effort: resolvedReasoningEffort,
      service_tier: openaiOptions.serviceTier,
      prompt_cache_key: openaiOptions.promptCacheKey,
      prompt_cache_retention: openaiOptions.promptCacheRetention,
      safety_identifier: openaiOptions.safetyIdentifier,

      // 消息：
      messages,
    };

    // 删除推理模型不支持的设置
    // 请参阅 https://platform.openai.com/docs/guides/reasoning#limitations
    if (isReasoningModel) {
      // 当没有推理工作时，gpt-5.1 模型允许温度、topP、logprobs
      // https://platform.openai.com/docs/guides/latest-model#gpt-5-1-parameter-compatibility
      if (
        resolvedReasoningEffort !== 'none' ||
        !modelCapabilities.supportsNonReasoningParameters
      ) {
        if (baseArgs.temperature != null) {
          baseArgs.temperature = undefined;
          warnings.push({
            type: 'unsupported',
            feature: 'temperature',
            details: 'temperature is not supported for reasoning models',
          });
        }
        if (baseArgs.top_p != null) {
          baseArgs.top_p = undefined;
          warnings.push({
            type: 'unsupported',
            feature: 'topP',
            details: 'topP is not supported for reasoning models',
          });
        }
        if (baseArgs.logprobs != null) {
          baseArgs.logprobs = undefined;
          warnings.push({
            type: 'other',
            message: 'logprobs is not supported for reasoning models',
          });
        }
      }

      if (baseArgs.frequency_penalty != null) {
        baseArgs.frequency_penalty = undefined;
        warnings.push({
          type: 'unsupported',
          feature: 'frequencyPenalty',
          details: 'frequencyPenalty is not supported for reasoning models',
        });
      }
      if (baseArgs.presence_penalty != null) {
        baseArgs.presence_penalty = undefined;
        warnings.push({
          type: 'unsupported',
          feature: 'presencePenalty',
          details: 'presencePenalty is not supported for reasoning models',
        });
      }
      if (baseArgs.logit_bias != null) {
        baseArgs.logit_bias = undefined;
        warnings.push({
          type: 'other',
          message: 'logitBias is not supported for reasoning models',
        });
      }

      if (baseArgs.top_logprobs != null) {
        baseArgs.top_logprobs = undefined;
        warnings.push({
          type: 'other',
          message: 'topLogprobs is not supported for reasoning models',
        });
      }

      // 推理模型使用 max_completion_tokens 而不是 max_tokens：
      if (baseArgs.max_tokens != null) {
        if (baseArgs.max_completion_tokens == null) {
          baseArgs.max_completion_tokens = baseArgs.max_tokens;
        }
        baseArgs.max_tokens = undefined;
      }
    } else if (
      this.modelId.startsWith('gpt-4o-search-preview') ||
      this.modelId.startsWith('gpt-4o-mini-search-preview')
    ) {
      if (baseArgs.temperature != null) {
        baseArgs.temperature = undefined;
        warnings.push({
          type: 'unsupported',
          feature: 'temperature',
          details:
            'temperature is not supported for the search preview models and has been removed.',
        });
      }
    }

    // 验证柔性处理支持
    if (
      openaiOptions.serviceTier === 'flex' &&
      !modelCapabilities.supportsFlexProcessing
    ) {
      warnings.push({
        type: 'unsupported',
        feature: 'serviceTier',
        details:
          'flex processing is only available for o3, o4-mini, and gpt-5 models',
      });
      baseArgs.service_tier = undefined;
    }

    // 验证优先级处理支持
    if (
      openaiOptions.serviceTier === 'priority' &&
      !modelCapabilities.supportsPriorityProcessing
    ) {
      warnings.push({
        type: 'unsupported',
        feature: 'serviceTier',
        details:
          'priority processing is only available for supported models (gpt-4, gpt-5, gpt-5-mini, o3, o4-mini) and requires Enterprise access. gpt-5-nano is not supported',
      });
      baseArgs.service_tier = undefined;
    }

    const {
      tools: openaiTools,
      toolChoice: openaiToolChoice,
      toolWarnings,
    } = prepareChatTools({
      tools,
      toolChoice,
    });

    return {
      args: {
        ...baseArgs,
        tools: openaiTools,
        tool_choice: openaiToolChoice,
      },
      warnings: [...warnings, ...toolWarnings],
    };
  }

  async doGenerate(
    options: LanguageModelV4CallOptions,
  ): Promise<LanguageModelV4GenerateResult> {
    const { args: body, warnings } = await this.getArgs(options);

    const {
      responseHeaders,
      value: response,
      rawValue: rawResponse,
    } = await postJsonToApi({
      url: this.config.url({
        path: '/chat/completions',
        modelId: this.modelId,
      }),
      headers: combineHeaders(this.config.headers?.(), options.headers),
      body,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        openaiChatResponseSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const choice = response.choices[0];
    const content: Array<LanguageModelV4Content> = [];

    // 文字内容：
    const text = choice.message.content;
    if (text != null && text.length > 0) {
      content.push({ type: 'text', text });
    }

    // 工具调用：
    for (const toolCall of choice.message.tool_calls ?? []) {
      content.push({
        type: 'tool-call' as const,
        toolCallId: toolCall.id ?? generateId(),
        toolName: toolCall.function.name,
        input: toolCall.function.arguments!,
      });
    }

    // 注释/引文：
    for (const annotation of choice.message.annotations ?? []) {
      content.push({
        type: 'source',
        sourceType: 'url',
        id: generateId(),
        url: annotation.url_citation.url,
        title: annotation.url_citation.title,
      });
    }

    // 提供者元数据：
    const completionTokenDetails = response.usage?.completion_tokens_details;
    const providerMetadata: SharedV4ProviderMetadata = { openai: {} };
    if (completionTokenDetails?.accepted_prediction_tokens != null) {
      providerMetadata.openai.acceptedPredictionTokens =
        completionTokenDetails?.accepted_prediction_tokens;
    }
    if (completionTokenDetails?.rejected_prediction_tokens != null) {
      providerMetadata.openai.rejectedPredictionTokens =
        completionTokenDetails?.rejected_prediction_tokens;
    }
    if (choice.logprobs?.content != null) {
      providerMetadata.openai.logprobs = choice.logprobs.content;
    }

    return {
      content,
      finishReason: {
        unified: mapOpenAIFinishReason(choice.finish_reason),
        raw: choice.finish_reason ?? undefined,
      },
      usage: convertOpenAIChatUsage(response.usage),
      request: { body },
      response: {
        ...getResponseMetadata(response),
        headers: responseHeaders,
        body: rawResponse,
      },
      warnings,
      providerMetadata,
    };
  }

  async doStream(
    options: LanguageModelV4CallOptions,
  ): Promise<LanguageModelV4StreamResult> {
    const { args, warnings } = await this.getArgs(options);

    const body = {
      ...args,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    };

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url({
        path: '/chat/completions',
        modelId: this.modelId,
      }),
      headers: combineHeaders(this.config.headers?.(), options.headers),
      body,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        openaiChatChunkSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    let toolCallTracker: StreamingToolCallTracker;

    let finishReason: LanguageModelV4FinishReason = {
      unified: 'other',
      raw: undefined,
    };
    let usage: OpenAIChatUsage | undefined = undefined;
    let metadataExtracted = false;
    let isActiveText = false;

    const providerMetadata: SharedV4ProviderMetadata = { openai: {} };

    return {
      stream: response.pipeThrough(
        new TransformStream<
          ParseResult<OpenAIChatChunk>,
          LanguageModelV4StreamPart
        >({
          start(controller) {
            toolCallTracker = new StreamingToolCallTracker(controller, {
              generateId,
              typeValidation: 'if-present',
            });
            controller.enqueue({ type: 'stream-start', warnings });
          },

          transform(chunk, controller) {
            if (options.includeRawChunks) {
              controller.enqueue({ type: 'raw', rawValue: chunk.rawValue });
            }

            // 处理失败的块解析/验证：
            if (!chunk.success) {
              finishReason = { unified: 'error', raw: undefined };
              controller.enqueue({ type: 'error', error: chunk.error });
              return;
            }

            const value = chunk.value;

            // 处理错误块：
            if ('error' in value) {
              finishReason = { unified: 'error', raw: undefined };
              controller.enqueue({ type: 'error', error: value.error });
              return;
            }

            // 提取并发出一次响应元数据。通常它出现在第一个块中。
            // Azure 可能会在一个块前面添加一个不包含其他元数据的“prompt_filter_results”键，
            // https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/content-filter-annotations?tabs=powershell
            if (!metadataExtracted) {
              const metadata = getResponseMetadata(value);
              if (Object.values(metadata).some(Boolean)) {
                metadataExtracted = true;
                controller.enqueue({
                  type: 'response-metadata',
                  ...getResponseMetadata(value),
                });
              }
            }

            if (value.usage != null) {
              usage = value.usage;

              if (
                value.usage.completion_tokens_details
                  ?.accepted_prediction_tokens != null
              ) {
                providerMetadata.openai.acceptedPredictionTokens =
                  value.usage.completion_tokens_details?.accepted_prediction_tokens;
              }
              if (
                value.usage.completion_tokens_details
                  ?.rejected_prediction_tokens != null
              ) {
                providerMetadata.openai.rejectedPredictionTokens =
                  value.usage.completion_tokens_details?.rejected_prediction_tokens;
              }
            }

            const choice = value.choices[0];

            if (choice?.finish_reason != null) {
              finishReason = {
                unified: mapOpenAIFinishReason(choice.finish_reason),
                raw: choice.finish_reason,
              };
            }

            if (choice?.logprobs?.content != null) {
              providerMetadata.openai.logprobs = choice.logprobs.content;
            }

            if (choice?.delta == null) {
              return;
            }

            const delta = choice.delta;

            if (delta.content != null) {
              if (!isActiveText) {
                controller.enqueue({ type: 'text-start', id: '0' });
                isActiveText = true;
              }

              controller.enqueue({
                type: 'text-delta',
                id: '0',
                delta: delta.content,
              });
            }

            if (delta.tool_calls != null) {
              for (const toolCallDelta of delta.tool_calls) {
                toolCallTracker.processDelta(toolCallDelta);
              }
            }

            // 注释/引文：
            if (delta.annotations != null) {
              for (const annotation of delta.annotations) {
                controller.enqueue({
                  type: 'source',
                  sourceType: 'url',
                  id: generateId(),
                  url: annotation.url_citation.url,
                  title: annotation.url_citation.title,
                });
              }
            }
          },

          flush(controller) {
            if (isActiveText) {
              controller.enqueue({ type: 'text-end', id: '0' });
            }

            toolCallTracker.flush();

            controller.enqueue({
              type: 'finish',
              finishReason,
              usage: convertOpenAIChatUsage(usage),
              ...(providerMetadata != null ? { providerMetadata } : {}),
            });
          },
        }),
      ),
      request: { body },
      response: { headers: responseHeaders },
    };
  }
}
