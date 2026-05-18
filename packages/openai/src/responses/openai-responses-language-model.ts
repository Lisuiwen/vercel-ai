import {
  APICallError,
  type JSONValue,
  type LanguageModelV4,
  type LanguageModelV4Prompt,
  type LanguageModelV4CallOptions,
  type LanguageModelV4Content,
  type LanguageModelV4FinishReason,
  type LanguageModelV4GenerateResult,
  type LanguageModelV4ProviderTool,
  type LanguageModelV4StreamPart,
  type LanguageModelV4StreamResult,
  type LanguageModelV4ToolApprovalRequest,
  type SharedV4ProviderMetadata,
  type SharedV4Warning,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  createToolNameMapping,
  generateId,
  isCustomReasoning,
  parseProviderOptions,
  postJsonToApi,
  serializeModelOptions,
  WORKFLOW_DESERIALIZE,
  WORKFLOW_SERIALIZE,
  type InferSchema,
  type ParseResult,
} from '@ai-sdk/provider-utils';
import type { OpenAIConfig } from '../openai-config';
import { openaiFailedResponseHandler } from '../openai-error';
import { getOpenAILanguageModelCapabilities } from '../openai-language-model-capabilities';
import type { applyPatchInputSchema } from '../tool/apply-patch';
import type {
  codeInterpreterInputSchema,
  codeInterpreterOutputSchema,
} from '../tool/code-interpreter';
import type { fileSearchOutputSchema } from '../tool/file-search';
import type { imageGenerationOutputSchema } from '../tool/image-generation';
import type { localShellInputSchema } from '../tool/local-shell';
import type { mcpOutputSchema } from '../tool/mcp';
import type { shellInputSchema, shellOutputSchema } from '../tool/shell';
import type {
  toolSearchInputSchema,
  toolSearchOutputSchema,
} from '../tool/tool-search';
import type { webSearchOutputSchema } from '../tool/web-search';
import {
  convertOpenAIResponsesUsage,
  type OpenAIResponsesUsage,
} from './convert-openai-responses-usage';
import { convertToOpenAIResponsesInput } from './convert-to-openai-responses-input';
import { mapOpenAIResponseFinishReason } from './map-openai-responses-finish-reason';
import {
  openaiResponsesChunkSchema,
  openaiResponsesResponseSchema,
  type OpenAIResponsesChunk,
  type OpenAIResponsesIncludeOptions,
  type OpenAIResponsesIncludeValue,
  type OpenAIResponsesLogprobs,
  type OpenAIResponsesWebSearchAction,
  type OpenAIResponsesApplyPatchOperationDiffDeltaChunk,
  type OpenAIResponsesApplyPatchOperationDiffDoneChunk,
} from './openai-responses-api';
import {
  openaiLanguageModelResponsesOptionsSchema,
  TOP_LOGPROBS_MAX,
  type OpenAIResponsesModelId,
} from './openai-responses-language-model-options';
import { prepareResponsesTools } from './openai-responses-prepare-tools';
import type {
  ResponsesCompactionProviderMetadata,
  ResponsesProviderMetadata,
  ResponsesReasoningProviderMetadata,
  ResponsesSourceDocumentProviderMetadata,
  ResponsesTextProviderMetadata,
} from './openai-responses-provider-metadata';

/**
 * 提取从 MCP 批准请求 ID 到其相应工具调用 ID 的映射
 * 从提示中。当 MCP 工具需要批准时，我们会生成一个工具调用 ID 来跟踪
 * 我们的系统中正在等待批准。当用户响应批准时（并且我们
 * 继续对话），我们需要将批准请求 ID 映射回我们的工具调用 ID
 * 以便工具结果引用正确的工具调用。
 */
function extractApprovalRequestIdToToolCallIdMapping(
  prompt: LanguageModelV4Prompt,
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const message of prompt) {
    if (message.role !== 'assistant') continue;
    for (const part of message.content) {
      if (part.type !== 'tool-call') continue;
      const approvalRequestId = part.providerOptions?.openai
        ?.approvalRequestId as string | undefined;
      if (approvalRequestId != null) {
        mapping[approvalRequestId] = part.toolCallId;
      }
    }
  }
  return mapping;
}

export class OpenAIResponsesLanguageModel implements LanguageModelV4 {
  readonly specificationVersion = 'v4';

  readonly modelId: OpenAIResponsesModelId;

  private readonly config: OpenAIConfig;

  static [WORKFLOW_SERIALIZE](model: OpenAIResponsesLanguageModel) {
    return serializeModelOptions({
      modelId: model.modelId,
      config: model.config,
    });
  }

  static [WORKFLOW_DESERIALIZE](options: {
    modelId: OpenAIResponsesModelId;
    config: OpenAIConfig;
  }) {
    return new OpenAIResponsesLanguageModel(options.modelId, options.config);
  }

  constructor(modelId: OpenAIResponsesModelId, config: OpenAIConfig) {
    this.modelId = modelId;
    this.config = config;
  }

  readonly supportedUrls: Record<string, RegExp[]> = {
    'image/*': [/^https?:\/\/.*$/],
    'application/pdf': [/^https?:\/\/.*$/],
  };

  get provider(): string {
    return this.config.provider;
  }

  private async getArgs({
    maxOutputTokens,
    temperature,
    stopSequences,
    topP,
    topK,
    presencePenalty,
    frequencyPenalty,
    seed,
    prompt,
    reasoning,
    providerOptions,
    tools,
    toolChoice,
    responseFormat,
  }: LanguageModelV4CallOptions) {
    const warnings: SharedV4Warning[] = [];
    const modelCapabilities = getOpenAILanguageModelCapabilities(this.modelId);

    if (topK != null) {
      warnings.push({ type: 'unsupported', feature: 'topK' });
    }

    if (seed != null) {
      warnings.push({ type: 'unsupported', feature: 'seed' });
    }

    if (presencePenalty != null) {
      warnings.push({ type: 'unsupported', feature: 'presencePenalty' });
    }

    if (frequencyPenalty != null) {
      warnings.push({ type: 'unsupported', feature: 'frequencyPenalty' });
    }

    if (stopSequences != null) {
      warnings.push({ type: 'unsupported', feature: 'stopSequences' });
    }

    const providerOptionsName = this.config.provider.includes('azure')
      ? 'azure'
      : 'openai';
    let openaiOptions = await parseProviderOptions({
      provider: providerOptionsName,
      providerOptions,
      schema: openaiLanguageModelResponsesOptionsSchema,
    });

    if (openaiOptions == null && providerOptionsName !== 'openai') {
      openaiOptions = await parseProviderOptions({
        provider: 'openai',
        providerOptions,
        schema: openaiLanguageModelResponsesOptionsSchema,
      });
    }

    const resolvedReasoningEffort =
      openaiOptions?.reasoningEffort ??
      (isCustomReasoning(reasoning) ? reasoning : undefined);

    const isReasoningModel =
      openaiOptions?.forceReasoning ?? modelCapabilities.isReasoningModel;

    if (openaiOptions?.conversation && openaiOptions?.previousResponseId) {
      warnings.push({
        type: 'unsupported',
        feature: 'conversation',
        details: 'conversation and previousResponseId cannot be used together',
      });
    }

    const toolNameMapping = createToolNameMapping({
      tools,
      providerToolNames: {
        'openai.code_interpreter': 'code_interpreter',
        'openai.file_search': 'file_search',
        'openai.image_generation': 'image_generation',
        'openai.local_shell': 'local_shell',
        'openai.shell': 'shell',
        'openai.web_search': 'web_search',
        'openai.web_search_preview': 'web_search_preview',
        'openai.mcp': 'mcp',
        'openai.apply_patch': 'apply_patch',
        'openai.tool_search': 'tool_search',
      },
    });

    const customProviderToolNames = new Set<string>();
    const {
      tools: openaiTools,
      toolChoice: openaiToolChoice,
      toolWarnings,
    } = await prepareResponsesTools({
      tools,
      toolChoice,
      allowedTools: openaiOptions?.allowedTools ?? undefined,
      toolNameMapping,
      customProviderToolNames,
    });

    const { input, warnings: inputWarnings } =
      await convertToOpenAIResponsesInput({
        prompt,
        toolNameMapping,
        systemMessageMode:
          openaiOptions?.systemMessageMode ??
          (isReasoningModel
            ? 'developer'
            : modelCapabilities.systemMessageMode),
        providerOptionsName,
        fileIdPrefixes: this.config.fileIdPrefixes,
        passThroughUnsupportedFiles:
          openaiOptions?.passThroughUnsupportedFiles ?? false,
        store: openaiOptions?.store ?? true,
        hasConversation: openaiOptions?.conversation != null,
        hasLocalShellTool: hasOpenAITool('openai.local_shell'),
        hasShellTool: hasOpenAITool('openai.shell'),
        hasApplyPatchTool: hasOpenAITool('openai.apply_patch'),
        customProviderToolNames:
          customProviderToolNames.size > 0
            ? customProviderToolNames
            : undefined,
      });

    warnings.push(...inputWarnings);

    const strictJsonSchema = openaiOptions?.strictJsonSchema ?? true;

    let include: OpenAIResponsesIncludeOptions = openaiOptions?.include;

    function addInclude(key: OpenAIResponsesIncludeValue) {
      if (include == null) {
        include = [key];
      } else if (!include.includes(key)) {
        include = [...include, key];
      }
    }

    function hasOpenAITool(id: string) {
      return (
        tools?.find(tool => tool.type === 'provider' && tool.id === id) != null
      );
    }

    // 当请求 logprobs 时，自动包含它们：
    const topLogprobs =
      typeof openaiOptions?.logprobs === 'number'
        ? openaiOptions?.logprobs
        : openaiOptions?.logprobs === true
          ? TOP_LOGPROBS_MAX
          : undefined;

    if (topLogprobs) {
      addInclude('message.output_text.logprobs');
    }

    // 当存在网络搜索工具时，自动包含来源：
    const webSearchToolName = (
      tools?.find(
        tool =>
          tool.type === 'provider' &&
          (tool.id === 'openai.web_search' ||
            tool.id === 'openai.web_search_preview'),
      ) as LanguageModelV4ProviderTool | undefined
    )?.name;

    if (webSearchToolName) {
      addInclude('web_search_call.action.sources');
    }

    // 当存在代码解释器工具时，自动包含输出：
    if (hasOpenAITool('openai.code_interpreter')) {
      addInclude('code_interpreter_call.outputs');
    }

    const store = openaiOptions?.store;

    // 在 OpenAI 响应 API 中 store 默认为 true，因此请准确检查 false：
    if (store === false && isReasoningModel) {
      addInclude('reasoning.encrypted_content');
    }

    const baseArgs = {
      model: this.modelId,
      input,
      temperature,
      top_p: topP,
      max_output_tokens: maxOutputTokens,

      ...((responseFormat?.type === 'json' || openaiOptions?.textVerbosity) && {
        text: {
          ...(responseFormat?.type === 'json' && {
            format:
              responseFormat.schema != null
                ? {
                    type: 'json_schema',
                    strict: strictJsonSchema,
                    name: responseFormat.name ?? 'response',
                    description: responseFormat.description,
                    schema: responseFormat.schema,
                  }
                : { type: 'json_object' },
          }),
          ...(openaiOptions?.textVerbosity && {
            verbosity: openaiOptions.textVerbosity,
          }),
        },
      }),

      // 提供商选项：
      conversation: openaiOptions?.conversation,
      max_tool_calls: openaiOptions?.maxToolCalls,
      metadata: openaiOptions?.metadata,
      parallel_tool_calls: openaiOptions?.parallelToolCalls,
      previous_response_id: openaiOptions?.previousResponseId,
      store,
      user: openaiOptions?.user,
      instructions: openaiOptions?.instructions,
      service_tier: openaiOptions?.serviceTier,
      include,
      prompt_cache_key: openaiOptions?.promptCacheKey,
      prompt_cache_retention: openaiOptions?.promptCacheRetention,
      safety_identifier: openaiOptions?.safetyIdentifier,
      top_logprobs: topLogprobs,
      truncation: openaiOptions?.truncation,

      // 上下文管理（服务器端压缩）：
      ...(openaiOptions?.contextManagement && {
        context_management: openaiOptions.contextManagement.map(cm => ({
          type: cm.type,
          compact_threshold: cm.compactThreshold,
        })),
      }),

      // 特定于模型的设置：
      ...(isReasoningModel &&
        (resolvedReasoningEffort != null ||
          openaiOptions?.reasoningSummary != null) && {
          reasoning: {
            ...(resolvedReasoningEffort != null && {
              effort: resolvedReasoningEffort,
            }),
            ...(openaiOptions?.reasoningSummary != null && {
              summary: openaiOptions.reasoningSummary,
            }),
          },
        }),
    };

    // 删除推理模型不支持的设置
    // 请参阅 https://platform.openai.com/docs/guides/reasoning#limitations
    if (isReasoningModel) {
      // 当没有推理工作时，gpt-5.1 模型允许温度、topP、logprobs
      // https://platform.openai.com/docs/guides/latest-model#gpt-5-1-parameter-compatibility
      if (
        !(
          resolvedReasoningEffort === 'none' &&
          modelCapabilities.supportsNonReasoningParameters
        )
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
      }
    } else {
      if (openaiOptions?.reasoningEffort != null) {
        warnings.push({
          type: 'unsupported',
          feature: 'reasoningEffort',
          details: 'reasoningEffort is not supported for non-reasoning models',
        });
      }

      if (openaiOptions?.reasoningSummary != null) {
        warnings.push({
          type: 'unsupported',
          feature: 'reasoningSummary',
          details: 'reasoningSummary is not supported for non-reasoning models',
        });
      }
    }

    // 验证柔性处理支持
    if (
      openaiOptions?.serviceTier === 'flex' &&
      !modelCapabilities.supportsFlexProcessing
    ) {
      warnings.push({
        type: 'unsupported',
        feature: 'serviceTier',
        details:
          'flex processing is only available for o3, o4-mini, and gpt-5 models',
      });
      // 如果不支持，请从 args 中删除
      delete (baseArgs as any).service_tier;
    }

    // 验证优先级处理支持
    if (
      openaiOptions?.serviceTier === 'priority' &&
      !modelCapabilities.supportsPriorityProcessing
    ) {
      warnings.push({
        type: 'unsupported',
        feature: 'serviceTier',
        details:
          'priority processing is only available for supported models (gpt-4, gpt-5, gpt-5-mini, o3, o4-mini) and requires Enterprise access. gpt-5-nano is not supported',
      });
      // 如果不支持，请从 args 中删除
      delete (baseArgs as any).service_tier;
    }

    const shellToolEnvType = (
      tools?.find(
        tool => tool.type === 'provider' && tool.id === 'openai.shell',
      ) as { args?: { environment?: { type?: string } } } | undefined
    )?.args?.environment?.type;

    const isShellProviderExecuted =
      shellToolEnvType === 'containerAuto' ||
      shellToolEnvType === 'containerReference';

    return {
      webSearchToolName,
      args: {
        ...baseArgs,
        tools: openaiTools,
        tool_choice: openaiToolChoice,
      },
      warnings: [...warnings, ...toolWarnings],
      store,
      toolNameMapping,
      providerOptionsName,
      isShellProviderExecuted,
    };
  }

  async doGenerate(
    options: LanguageModelV4CallOptions,
  ): Promise<LanguageModelV4GenerateResult> {
    const {
      args: body,
      warnings,
      webSearchToolName,
      toolNameMapping,
      providerOptionsName,
      isShellProviderExecuted,
    } = await this.getArgs(options);
    const url = this.config.url({
      path: '/responses',
      modelId: this.modelId,
    });

    const approvalRequestIdToDummyToolCallIdFromPrompt =
      extractApprovalRequestIdToToolCallIdMapping(options.prompt);

    const {
      responseHeaders,
      value: response,
      rawValue: rawResponse,
    } = await postJsonToApi({
      url,
      headers: combineHeaders(this.config.headers?.(), options.headers),
      body,
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        openaiResponsesResponseSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    if (response.error) {
      throw new APICallError({
        message: response.error.message,
        url,
        requestBodyValues: body,
        statusCode: 400,
        responseHeaders,
        responseBody: rawResponse as string,
        isRetryable: false,
      });
    }

    const content: Array<LanguageModelV4Content> = [];
    const logprobs: Array<OpenAIResponsesLogprobs> = [];

    // 检查是否有客户端工具调用的标志（不是由 openai 执行的）
    let hasFunctionCall = false;
    const hostedToolSearchCallIds: string[] = [];

    // 将响应内容映射到内容数组（没有错误时定义）
    for (const part of response.output!) {
      switch (part.type) {
        case 'reasoning': {
          // 当没有总结部分时，我们需要添加一个空的推理部分：
          if (part.summary.length === 0) {
            part.summary.push({ type: 'summary_text', text: '' });
          }

          for (const summary of part.summary) {
            content.push({
              type: 'reasoning' as const,
              text: summary.text,
              providerMetadata: {
                [providerOptionsName]: {
                  itemId: part.id,
                  reasoningEncryptedContent: part.encrypted_content ?? null,
                } satisfies ResponsesReasoningProviderMetadata,
              },
            });
          }
          break;
        }

        case 'image_generation_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('image_generation'),
            input: '{}',
            providerExecuted: true,
          });

          content.push({
            type: 'tool-result',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('image_generation'),
            result: {
              result: part.result,
            } satisfies InferSchema<typeof imageGenerationOutputSchema>,
          });

          break;
        }

        case 'tool_search_call': {
          const toolCallId = part.call_id ?? part.id;
          const isHosted = part.execution === 'server';

          if (isHosted) {
            hostedToolSearchCallIds.push(toolCallId);
          }

          content.push({
            type: 'tool-call',
            toolCallId,
            toolName: toolNameMapping.toCustomToolName('tool_search'),
            input: JSON.stringify({
              arguments: part.arguments,
              call_id: part.call_id,
            } satisfies InferSchema<typeof toolSearchInputSchema>),
            ...(isHosted ? { providerExecuted: true } : {}),
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
              },
            },
          });

          break;
        }

        case 'tool_search_output': {
          const toolCallId =
            part.call_id ?? hostedToolSearchCallIds.shift() ?? part.id;

          content.push({
            type: 'tool-result',
            toolCallId,
            toolName: toolNameMapping.toCustomToolName('tool_search'),
            result: {
              tools: part.tools,
            } satisfies InferSchema<typeof toolSearchOutputSchema>,
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
              },
            },
          });

          break;
        }

        case 'local_shell_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.call_id,
            toolName: toolNameMapping.toCustomToolName('local_shell'),
            input: JSON.stringify({
              action: part.action,
            } satisfies InferSchema<typeof localShellInputSchema>),
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
              },
            },
          });

          break;
        }

        case 'shell_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.call_id,
            toolName: toolNameMapping.toCustomToolName('shell'),
            input: JSON.stringify({
              action: {
                commands: part.action.commands,
              },
            } satisfies InferSchema<typeof shellInputSchema>),
            ...(isShellProviderExecuted && { providerExecuted: true }),
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
              },
            },
          });

          break;
        }

        case 'shell_call_output': {
          content.push({
            type: 'tool-result',
            toolCallId: part.call_id,
            toolName: toolNameMapping.toCustomToolName('shell'),
            result: {
              output: part.output.map(item => ({
                stdout: item.stdout,
                stderr: item.stderr,
                outcome:
                  item.outcome.type === 'exit'
                    ? {
                        type: 'exit' as const,
                        exitCode: item.outcome.exit_code,
                      }
                    : { type: 'timeout' as const },
              })),
            } satisfies InferSchema<typeof shellOutputSchema>,
          });
          break;
        }

        case 'message': {
          for (const contentPart of part.content) {
            if (
              options.providerOptions?.[providerOptionsName]?.logprobs &&
              contentPart.logprobs
            ) {
              logprobs.push(contentPart.logprobs);
            }

            const providerMetadata: SharedV4ProviderMetadata[string] = {
              itemId: part.id,
              ...(part.phase != null && { phase: part.phase }),
              ...(contentPart.annotations.length > 0 && {
                annotations: contentPart.annotations,
              }),
            } satisfies ResponsesTextProviderMetadata;

            content.push({
              type: 'text',
              text: contentPart.text,
              providerMetadata: {
                [providerOptionsName]: providerMetadata,
              },
            });

            for (const annotation of contentPart.annotations) {
              if (annotation.type === 'url_citation') {
                content.push({
                  type: 'source',
                  sourceType: 'url',
                  id: this.config.generateId?.() ?? generateId(),
                  url: annotation.url,
                  title: annotation.title,
                });
              } else if (annotation.type === 'file_citation') {
                content.push({
                  type: 'source',
                  sourceType: 'document',
                  id: this.config.generateId?.() ?? generateId(),
                  mediaType: 'text/plain',
                  title: annotation.filename,
                  filename: annotation.filename,
                  providerMetadata: {
                    [providerOptionsName]: {
                      type: annotation.type,
                      fileId: annotation.file_id,
                      index: annotation.index,
                    } satisfies Extract<
                      ResponsesSourceDocumentProviderMetadata,
                      { type: 'file_citation' }
                    >,
                  },
                });
              } else if (annotation.type === 'container_file_citation') {
                content.push({
                  type: 'source',
                  sourceType: 'document',
                  id: this.config.generateId?.() ?? generateId(),
                  mediaType: 'text/plain',
                  title: annotation.filename,
                  filename: annotation.filename,
                  providerMetadata: {
                    [providerOptionsName]: {
                      type: annotation.type,
                      fileId: annotation.file_id,
                      containerId: annotation.container_id,
                    } satisfies Extract<
                      ResponsesSourceDocumentProviderMetadata,
                      { type: 'container_file_citation' }
                    >,
                  },
                });
              } else if (annotation.type === 'file_path') {
                content.push({
                  type: 'source',
                  sourceType: 'document',
                  id: this.config.generateId?.() ?? generateId(),
                  mediaType: 'application/octet-stream',
                  title: annotation.file_id,
                  filename: annotation.file_id,
                  providerMetadata: {
                    [providerOptionsName]: {
                      type: annotation.type,
                      fileId: annotation.file_id,
                      index: annotation.index,
                    } satisfies Extract<
                      ResponsesSourceDocumentProviderMetadata,
                      { type: 'file_path' }
                    >,
                  },
                });
              }
            }
          }

          break;
        }

        case 'function_call': {
          hasFunctionCall = true;

          content.push({
            type: 'tool-call',
            toolCallId: part.call_id,
            toolName: part.name,
            input: part.arguments,
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
                ...(part.namespace != null && { namespace: part.namespace }),
              },
            },
          });
          break;
        }

        case 'custom_tool_call': {
          hasFunctionCall = true;
          const toolName = toolNameMapping.toCustomToolName(part.name);

          content.push({
            type: 'tool-call',
            toolCallId: part.call_id,
            toolName,
            input: JSON.stringify(part.input),
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
              },
            },
          });
          break;
        }

        case 'web_search_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName(
              webSearchToolName ?? 'web_search',
            ),
            input: JSON.stringify({}),
            providerExecuted: true,
          });

          content.push({
            type: 'tool-result',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName(
              webSearchToolName ?? 'web_search',
            ),
            result: mapWebSearchOutput(part.action),
          });

          break;
        }

        case 'mcp_call': {
          const toolCallId =
            part.approval_request_id != null
              ? (approvalRequestIdToDummyToolCallIdFromPrompt[
                  part.approval_request_id
                ] ?? part.id)
              : part.id;

          const toolName = `mcp.${part.name}`;

          content.push({
            type: 'tool-call',
            toolCallId,
            toolName,
            input: part.arguments,
            providerExecuted: true,
            dynamic: true,
          });

          content.push({
            type: 'tool-result',
            toolCallId,
            toolName,
            result: {
              type: 'call',
              serverLabel: part.server_label,
              name: part.name,
              arguments: part.arguments,
              ...(part.output != null ? { output: part.output } : {}),
              ...(part.error != null
                ? { error: part.error as unknown as JSONValue }
                : {}),
            } satisfies InferSchema<typeof mcpOutputSchema>,
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
              },
            },
          });
          break;
        }

        case 'mcp_list_tools': {
          // 跳过
          break;
        }

        case 'mcp_approval_request': {
          const approvalRequestId = part.approval_request_id ?? part.id;
          const dummyToolCallId = this.config.generateId?.() ?? generateId();
          const toolName = `mcp.${part.name}`;

          content.push({
            type: 'tool-call',
            toolCallId: dummyToolCallId,
            toolName,
            input: part.arguments,
            providerExecuted: true,
            dynamic: true,
          });

          content.push({
            type: 'tool-approval-request',
            approvalId: approvalRequestId,
            toolCallId: dummyToolCallId,
          } satisfies LanguageModelV4ToolApprovalRequest);
          break;
        }

        case 'computer_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('computer_use'),
            input: '',
            providerExecuted: true,
          });

          content.push({
            type: 'tool-result',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('computer_use'),
            result: {
              type: 'computer_use_tool_result',
              status: part.status || 'completed',
            },
          });
          break;
        }

        case 'file_search_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('file_search'),
            input: '{}',
            providerExecuted: true,
          });

          content.push({
            type: 'tool-result',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('file_search'),
            result: {
              queries: part.queries,
              results:
                part.results?.map(result => ({
                  attributes: result.attributes,
                  fileId: result.file_id,
                  filename: result.filename,
                  score: result.score,
                  text: result.text,
                })) ?? null,
            } satisfies InferSchema<typeof fileSearchOutputSchema>,
          });
          break;
        }

        case 'code_interpreter_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('code_interpreter'),
            input: JSON.stringify({
              code: part.code,
              containerId: part.container_id,
            } satisfies InferSchema<typeof codeInterpreterInputSchema>),
            providerExecuted: true,
          });

          content.push({
            type: 'tool-result',
            toolCallId: part.id,
            toolName: toolNameMapping.toCustomToolName('code_interpreter'),
            result: {
              outputs: part.outputs,
            } satisfies InferSchema<typeof codeInterpreterOutputSchema>,
          });
          break;
        }

        case 'apply_patch_call': {
          content.push({
            type: 'tool-call',
            toolCallId: part.call_id,
            toolName: toolNameMapping.toCustomToolName('apply_patch'),
            input: JSON.stringify({
              callId: part.call_id,
              operation: part.operation,
            } satisfies InferSchema<typeof applyPatchInputSchema>),
            providerMetadata: {
              [providerOptionsName]: {
                itemId: part.id,
              },
            },
          });

          break;
        }

        case 'compaction': {
          content.push({
            type: 'custom',
            kind: 'openai.compaction',
            providerMetadata: {
              [providerOptionsName]: {
                type: 'compaction',
                itemId: part.id,
                encryptedContent: part.encrypted_content,
              } satisfies ResponsesCompactionProviderMetadata,
            },
          });
          break;
        }
      }
    }

    const providerMetadata: SharedV4ProviderMetadata = {
      [providerOptionsName]: {
        responseId: response.id,
        ...(logprobs.length > 0 ? { logprobs } : {}),
        ...(typeof response.service_tier === 'string'
          ? { serviceTier: response.service_tier }
          : {}),
      } satisfies ResponsesProviderMetadata,
    };

    const usage = response.usage!; // 没有错误时定义

    return {
      content,
      finishReason: {
        unified: mapOpenAIResponseFinishReason({
          finishReason: response.incomplete_details?.reason,
          hasFunctionCall,
        }),
        raw: response.incomplete_details?.reason ?? undefined,
      },
      usage: convertOpenAIResponsesUsage(usage),
      request: { body },
      response: {
        id: response.id,
        timestamp: new Date(response.created_at! * 1000),
        modelId: response.model,
        headers: responseHeaders,
        body: rawResponse,
      },
      providerMetadata,
      warnings,
    };
  }

  async doStream(
    options: LanguageModelV4CallOptions,
  ): Promise<LanguageModelV4StreamResult> {
    const {
      args: body,
      warnings,
      webSearchToolName,
      toolNameMapping,
      store,
      providerOptionsName,
      isShellProviderExecuted,
    } = await this.getArgs(options);

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url({
        path: '/responses',
        modelId: this.modelId,
      }),
      headers: combineHeaders(this.config.headers?.(), options.headers),
      body: {
        ...body,
        stream: true,
      },
      failedResponseHandler: openaiFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        openaiResponsesChunkSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const self = this;

    const approvalRequestIdToDummyToolCallIdFromPrompt =
      extractApprovalRequestIdToToolCallIdMapping(options.prompt);

    const approvalRequestIdToDummyToolCallIdFromStream = new Map<
      string,
      string
    >();

    let finishReason: LanguageModelV4FinishReason = {
      unified: 'other',
      raw: undefined,
    };
    let usage: OpenAIResponsesUsage | undefined = undefined;
    const logprobs: Array<OpenAIResponsesLogprobs> = [];
    let responseId: string | null = null;

    const ongoingToolCalls: Record<
      number,
      | {
          toolName: string;
          toolCallId: string;
          codeInterpreter?: {
            containerId: string;
          };
          applyPatch?: {
            hasDiff: boolean;
            endEmitted: boolean;
          };
          toolSearchExecution?: 'server' | 'client';
        }
      | undefined
    > = {};

    // 在“text-end”部分providerMetadata中设置注释。
    const ongoingAnnotations: Array<
      Extract<
        OpenAIResponsesChunk,
        { type: 'response.output_text.annotation.added' }
      >['annotation']
    > = [];

    // 跟踪当前正在传输的消息的阶段
    let activeMessagePhase: 'commentary' | 'final_answer' | undefined;

    // 检查是否有客户端工具调用的标志（不是由 openai 执行的）
    let hasFunctionCall = false;

    const activeReasoning: Record<
      string,
      {
        encryptedContent?: string | null;
        // 摘要索引作为推理部分状态的字符串：
        summaryParts: Record<string, 'active' | 'can-conclude' | 'concluded'>;
      }
    > = {};

    let serviceTier: string | undefined;
    const hostedToolSearchCallIds: string[] = [];

    return {
      stream: response.pipeThrough(
        new TransformStream<
          ParseResult<OpenAIResponsesChunk>,
          LanguageModelV4StreamPart
        >({
          start(controller) {
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

            if (isResponseOutputItemAddedChunk(value)) {
              if (value.item.type === 'function_call') {
                ongoingToolCalls[value.output_index] = {
                  toolName: value.item.name,
                  toolCallId: value.item.call_id,
                };

                controller.enqueue({
                  type: 'tool-input-start',
                  id: value.item.call_id,
                  toolName: value.item.name,
                });
              } else if (value.item.type === 'custom_tool_call') {
                const toolName = toolNameMapping.toCustomToolName(
                  value.item.name,
                );
                ongoingToolCalls[value.output_index] = {
                  toolName,
                  toolCallId: value.item.call_id,
                };

                controller.enqueue({
                  type: 'tool-input-start',
                  id: value.item.call_id,
                  toolName,
                });
              } else if (value.item.type === 'web_search_call') {
                ongoingToolCalls[value.output_index] = {
                  toolName: toolNameMapping.toCustomToolName(
                    webSearchToolName ?? 'web_search',
                  ),
                  toolCallId: value.item.id,
                };

                controller.enqueue({
                  type: 'tool-input-start',
                  id: value.item.id,
                  toolName: toolNameMapping.toCustomToolName(
                    webSearchToolName ?? 'web_search',
                  ),
                  providerExecuted: true,
                });

                controller.enqueue({
                  type: 'tool-input-end',
                  id: value.item.id,
                });

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.id,
                  toolName: toolNameMapping.toCustomToolName(
                    webSearchToolName ?? 'web_search',
                  ),
                  input: JSON.stringify({}),
                  providerExecuted: true,
                });
              } else if (value.item.type === 'computer_call') {
                ongoingToolCalls[value.output_index] = {
                  toolName: toolNameMapping.toCustomToolName('computer_use'),
                  toolCallId: value.item.id,
                };

                controller.enqueue({
                  type: 'tool-input-start',
                  id: value.item.id,
                  toolName: toolNameMapping.toCustomToolName('computer_use'),
                  providerExecuted: true,
                });
              } else if (value.item.type === 'code_interpreter_call') {
                ongoingToolCalls[value.output_index] = {
                  toolName:
                    toolNameMapping.toCustomToolName('code_interpreter'),
                  toolCallId: value.item.id,
                  codeInterpreter: {
                    containerId: value.item.container_id,
                  },
                };

                controller.enqueue({
                  type: 'tool-input-start',
                  id: value.item.id,
                  toolName:
                    toolNameMapping.toCustomToolName('code_interpreter'),
                  providerExecuted: true,
                });

                controller.enqueue({
                  type: 'tool-input-delta',
                  id: value.item.id,
                  delta: `{"containerId":"${value.item.container_id}","code":"`,
                });
              } else if (value.item.type === 'file_search_call') {
                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.id,
                  toolName: toolNameMapping.toCustomToolName('file_search'),
                  input: '{}',
                  providerExecuted: true,
                });
              } else if (value.item.type === 'image_generation_call') {
                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.id,
                  toolName:
                    toolNameMapping.toCustomToolName('image_generation'),
                  input: '{}',
                  providerExecuted: true,
                });
              } else if (value.item.type === 'tool_search_call') {
                const toolCallId = value.item.id;
                const toolName =
                  toolNameMapping.toCustomToolName('tool_search');
                const isHosted = value.item.execution === 'server';

                ongoingToolCalls[value.output_index] = {
                  toolName,
                  toolCallId,
                  toolSearchExecution: value.item.execution ?? 'server',
                };

                if (isHosted) {
                  controller.enqueue({
                    type: 'tool-input-start',
                    id: toolCallId,
                    toolName,
                    providerExecuted: true,
                  });
                }
              } else if (value.item.type === 'tool_search_output') {
                // 在 output_item.done 上处理，以便我们可以将其与调用配对
              } else if (
                value.item.type === 'mcp_call' ||
                value.item.type === 'mcp_list_tools' ||
                value.item.type === 'mcp_approval_request'
              ) {
                // 相反，在 output_item.done 上发出 MCP 工具调用/批准部分，因此我们可以：
                // - 当存在approval_request_id时别名mcp_call ID
                // - 发出适当的工具批准请求部分以获得 MCP 批准
              } else if (value.item.type === 'apply_patch_call') {
                const { call_id: callId, operation } = value.item;

                ongoingToolCalls[value.output_index] = {
                  toolName: toolNameMapping.toCustomToolName('apply_patch'),
                  toolCallId: callId,
                  applyPatch: {
                    // delete_file 没有差异
                    hasDiff: operation.type === 'delete_file',
                    endEmitted: operation.type === 'delete_file',
                  },
                };

                controller.enqueue({
                  type: 'tool-input-start',
                  id: callId,
                  toolName: toolNameMapping.toCustomToolName('apply_patch'),
                });

                if (operation.type === 'delete_file') {
                  const inputString = JSON.stringify({
                    callId,
                    operation,
                  } satisfies InferSchema<typeof applyPatchInputSchema>);

                  controller.enqueue({
                    type: 'tool-input-delta',
                    id: callId,
                    delta: inputString,
                  });

                  controller.enqueue({
                    type: 'tool-input-end',
                    id: callId,
                  });
                } else {
                  controller.enqueue({
                    type: 'tool-input-delta',
                    id: callId,
                    delta: `{"callId":"${escapeJSONDelta(callId)}","operation":{"type":"${escapeJSONDelta(operation.type)}","path":"${escapeJSONDelta(operation.path)}","diff":"`,
                  });
                }
              } else if (value.item.type === 'shell_call') {
                ongoingToolCalls[value.output_index] = {
                  toolName: toolNameMapping.toCustomToolName('shell'),
                  toolCallId: value.item.call_id,
                };
              } else if (value.item.type === 'shell_call_output') {
                // shell_call_output 在output_item.done 中处理
              } else if (value.item.type === 'message') {
                ongoingAnnotations.splice(0, ongoingAnnotations.length);
                activeMessagePhase = value.item.phase ?? undefined;
                controller.enqueue({
                  type: 'text-start',
                  id: value.item.id,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item.id,
                      ...(value.item.phase != null && {
                        phase: value.item.phase,
                      }),
                    },
                  },
                });
              } else if (
                isResponseOutputItemAddedChunk(value) &&
                value.item.type === 'reasoning'
              ) {
                activeReasoning[value.item.id] = {
                  encryptedContent: value.item.encrypted_content,
                  summaryParts: { 0: 'active' },
                };

                controller.enqueue({
                  type: 'reasoning-start',
                  id: `${value.item.id}:0`,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item.id,
                      reasoningEncryptedContent:
                        value.item.encrypted_content ?? null,
                    } satisfies ResponsesReasoningProviderMetadata,
                  },
                });
              }
            } else if (isResponseOutputItemDoneChunk(value)) {
              if (value.item.type === 'message') {
                const phase = value.item.phase ?? activeMessagePhase;
                activeMessagePhase = undefined;
                controller.enqueue({
                  type: 'text-end',
                  id: value.item.id,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item.id,
                      ...(phase != null && { phase }),
                      ...(ongoingAnnotations.length > 0 && {
                        annotations: ongoingAnnotations,
                      }),
                    } satisfies ResponsesTextProviderMetadata,
                  },
                });
              } else if (value.item.type === 'function_call') {
                ongoingToolCalls[value.output_index] = undefined;
                hasFunctionCall = true;

                controller.enqueue({
                  type: 'tool-input-end',
                  id: value.item.call_id,
                  ...(value.item.namespace != null && {
                    providerMetadata: {
                      [providerOptionsName]: {
                        namespace: value.item.namespace,
                      },
                    },
                  }),
                });

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.call_id,
                  toolName: value.item.name,
                  input: value.item.arguments,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item.id,
                      ...(value.item.namespace != null && {
                        namespace: value.item.namespace,
                      }),
                    },
                  },
                });
              } else if (value.item.type === 'custom_tool_call') {
                ongoingToolCalls[value.output_index] = undefined;
                hasFunctionCall = true;
                const toolName = toolNameMapping.toCustomToolName(
                  value.item.name,
                );

                controller.enqueue({
                  type: 'tool-input-end',
                  id: value.item.call_id,
                });

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.call_id,
                  toolName,
                  input: JSON.stringify(value.item.input),
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item.id,
                    },
                  },
                });
              } else if (value.item.type === 'web_search_call') {
                ongoingToolCalls[value.output_index] = undefined;

                controller.enqueue({
                  type: 'tool-result',
                  toolCallId: value.item.id,
                  toolName: toolNameMapping.toCustomToolName(
                    webSearchToolName ?? 'web_search',
                  ),
                  result: mapWebSearchOutput(value.item.action),
                });
              } else if (value.item.type === 'computer_call') {
                ongoingToolCalls[value.output_index] = undefined;

                controller.enqueue({
                  type: 'tool-input-end',
                  id: value.item.id,
                });

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.id,
                  toolName: toolNameMapping.toCustomToolName('computer_use'),
                  input: '',
                  providerExecuted: true,
                });

                controller.enqueue({
                  type: 'tool-result',
                  toolCallId: value.item.id,
                  toolName: toolNameMapping.toCustomToolName('computer_use'),
                  result: {
                    type: 'computer_use_tool_result',
                    status: value.item.status || 'completed',
                  },
                });
              } else if (value.item.type === 'file_search_call') {
                ongoingToolCalls[value.output_index] = undefined;

                controller.enqueue({
                  type: 'tool-result',
                  toolCallId: value.item.id,
                  toolName: toolNameMapping.toCustomToolName('file_search'),
                  result: {
                    queries: value.item.queries,
                    results:
                      value.item.results?.map(result => ({
                        attributes: result.attributes,
                        fileId: result.file_id,
                        filename: result.filename,
                        score: result.score,
                        text: result.text,
                      })) ?? null,
                  } satisfies InferSchema<typeof fileSearchOutputSchema>,
                });
              } else if (value.item.type === 'code_interpreter_call') {
                ongoingToolCalls[value.output_index] = undefined;

                controller.enqueue({
                  type: 'tool-result',
                  toolCallId: value.item.id,
                  toolName:
                    toolNameMapping.toCustomToolName('code_interpreter'),
                  result: {
                    outputs: value.item.outputs,
                  } satisfies InferSchema<typeof codeInterpreterOutputSchema>,
                });
              } else if (value.item.type === 'image_generation_call') {
                controller.enqueue({
                  type: 'tool-result',
                  toolCallId: value.item.id,
                  toolName:
                    toolNameMapping.toCustomToolName('image_generation'),
                  result: {
                    result: value.item.result,
                  } satisfies InferSchema<typeof imageGenerationOutputSchema>,
                });
              } else if (value.item.type === 'tool_search_call') {
                const toolCall = ongoingToolCalls[value.output_index];
                const isHosted = value.item.execution === 'server';

                if (toolCall != null) {
                  const toolCallId = isHosted
                    ? toolCall.toolCallId
                    : (value.item.call_id ?? value.item.id);

                  if (isHosted) {
                    hostedToolSearchCallIds.push(toolCallId);
                  } else {
                    controller.enqueue({
                      type: 'tool-input-start',
                      id: toolCallId,
                      toolName: toolCall.toolName,
                    });
                  }

                  controller.enqueue({
                    type: 'tool-input-end',
                    id: toolCallId,
                  });

                  controller.enqueue({
                    type: 'tool-call',
                    toolCallId,
                    toolName: toolCall.toolName,
                    input: JSON.stringify({
                      arguments: value.item.arguments,
                      call_id: isHosted ? null : toolCallId,
                    } satisfies InferSchema<typeof toolSearchInputSchema>),
                    ...(isHosted ? { providerExecuted: true } : {}),
                    providerMetadata: {
                      [providerOptionsName]: {
                        itemId: value.item.id,
                      },
                    },
                  });
                }

                ongoingToolCalls[value.output_index] = undefined;
              } else if (value.item.type === 'tool_search_output') {
                const toolCallId =
                  value.item.call_id ??
                  hostedToolSearchCallIds.shift() ??
                  value.item.id;

                controller.enqueue({
                  type: 'tool-result',
                  toolCallId,
                  toolName: toolNameMapping.toCustomToolName('tool_search'),
                  result: {
                    tools: value.item.tools,
                  } satisfies InferSchema<typeof toolSearchOutputSchema>,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item.id,
                    },
                  },
                });
              } else if (value.item.type === 'mcp_call') {
                ongoingToolCalls[value.output_index] = undefined;

                const approvalRequestId =
                  value.item.approval_request_id ?? undefined;

                // 当 MCP 工具需要批准时，我们会使用自己的工具进行跟踪
                // 工具调用 ID，然后将 OpenAI 的approval_request_id 映射回我们的 ID，以便结果匹配。
                const aliasedToolCallId =
                  approvalRequestId != null
                    ? (approvalRequestIdToDummyToolCallIdFromStream.get(
                        approvalRequestId,
                      ) ??
                      approvalRequestIdToDummyToolCallIdFromPrompt[
                        approvalRequestId
                      ] ??
                      value.item.id)
                    : value.item.id;

                const toolName = `mcp.${value.item.name}`;

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: aliasedToolCallId,
                  toolName,
                  input: value.item.arguments,
                  providerExecuted: true,
                  dynamic: true,
                });

                controller.enqueue({
                  type: 'tool-result',
                  toolCallId: aliasedToolCallId,
                  toolName,
                  result: {
                    type: 'call',
                    serverLabel: value.item.server_label,
                    name: value.item.name,
                    arguments: value.item.arguments,
                    ...(value.item.output != null
                      ? { output: value.item.output }
                      : {}),
                    ...(value.item.error != null
                      ? { error: value.item.error as unknown as JSONValue }
                      : {}),
                  } satisfies InferSchema<typeof mcpOutputSchema>,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item.id,
                    },
                  },
                });
              } else if (value.item.type === 'mcp_list_tools') {
                // 跳过 listTools - 我们不会将其公开给 UI 或将其发回
                ongoingToolCalls[value.output_index] = undefined;

                // 跳过
              } else if (value.item.type === 'apply_patch_call') {
                const toolCall = ongoingToolCalls[value.output_index];
                if (
                  toolCall?.applyPatch &&
                  !toolCall.applyPatch.endEmitted &&
                  value.item.operation.type !== 'delete_file'
                ) {
                  if (!toolCall.applyPatch.hasDiff) {
                    controller.enqueue({
                      type: 'tool-input-delta',
                      id: toolCall.toolCallId,
                      delta: escapeJSONDelta(value.item.operation.diff),
                    });
                  }

                  controller.enqueue({
                    type: 'tool-input-delta',
                    id: toolCall.toolCallId,
                    delta: '"}}',
                  });

                  controller.enqueue({
                    type: 'tool-input-end',
                    id: toolCall.toolCallId,
                  });

                  toolCall.applyPatch.endEmitted = true;
                }

                // 当状态为“完成”时发出具有完整差异的最终工具调用
                if (toolCall && value.item.status === 'completed') {
                  controller.enqueue({
                    type: 'tool-call',
                    toolCallId: toolCall.toolCallId,
                    toolName: toolNameMapping.toCustomToolName('apply_patch'),
                    input: JSON.stringify({
                      callId: value.item.call_id,
                      operation: value.item.operation,
                    } satisfies InferSchema<typeof applyPatchInputSchema>),
                    providerMetadata: {
                      [providerOptionsName]: {
                        itemId: value.item.id,
                      },
                    },
                  });
                }

                ongoingToolCalls[value.output_index] = undefined;
              } else if (value.item.type === 'mcp_approval_request') {
                ongoingToolCalls[value.output_index] = undefined;

                const dummyToolCallId =
                  self.config.generateId?.() ?? generateId();
                const approvalRequestId =
                  value.item.approval_request_id ?? value.item.id;
                approvalRequestIdToDummyToolCallIdFromStream.set(
                  approvalRequestId,
                  dummyToolCallId,
                );

                const toolName = `mcp.${value.item.name}`;

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: dummyToolCallId,
                  toolName,
                  input: value.item.arguments,
                  providerExecuted: true,
                  dynamic: true,
                });

                controller.enqueue({
                  type: 'tool-approval-request',
                  approvalId: approvalRequestId,
                  toolCallId: dummyToolCallId,
                });
              } else if (value.item.type === 'local_shell_call') {
                ongoingToolCalls[value.output_index] = undefined;

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.call_id,
                  toolName: toolNameMapping.toCustomToolName('local_shell'),
                  input: JSON.stringify({
                    action: {
                      type: 'exec',
                      command: value.item.action.command,
                      timeoutMs: value.item.action.timeout_ms,
                      user: value.item.action.user,
                      workingDirectory: value.item.action.working_directory,
                      env: value.item.action.env,
                    },
                  } satisfies InferSchema<typeof localShellInputSchema>),
                  providerMetadata: {
                    [providerOptionsName]: { itemId: value.item.id },
                  },
                });
              } else if (value.item.type === 'shell_call') {
                ongoingToolCalls[value.output_index] = undefined;

                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: value.item.call_id,
                  toolName: toolNameMapping.toCustomToolName('shell'),
                  input: JSON.stringify({
                    action: {
                      commands: value.item.action.commands,
                    },
                  } satisfies InferSchema<typeof shellInputSchema>),
                  ...(isShellProviderExecuted && {
                    providerExecuted: true,
                  }),
                  providerMetadata: {
                    [providerOptionsName]: { itemId: value.item.id },
                  },
                });
              } else if (value.item.type === 'shell_call_output') {
                controller.enqueue({
                  type: 'tool-result',
                  toolCallId: value.item.call_id,
                  toolName: toolNameMapping.toCustomToolName('shell'),
                  result: {
                    output: value.item.output.map(
                      (item: {
                        stdout: string;
                        stderr: string;
                        outcome:
                          | { type: 'exit'; exit_code: number }
                          | { type: 'timeout' };
                      }) => ({
                        stdout: item.stdout,
                        stderr: item.stderr,
                        outcome:
                          item.outcome.type === 'exit'
                            ? {
                                type: 'exit' as const,
                                exitCode: item.outcome.exit_code,
                              }
                            : { type: 'timeout' as const },
                      }),
                    ),
                  } satisfies InferSchema<typeof shellOutputSchema>,
                });
              } else if (value.item.type === 'reasoning') {
                const activeReasoningPart = activeReasoning[value.item.id];

                // 获取所有活动或可以总结的摘要部分的 ID
                // 总结正在进行的推理部分：
                const summaryPartIndices = Object.entries(
                  activeReasoningPart.summaryParts,
                )
                  .filter(
                    ([_, status]) =>
                      status === 'active' || status === 'can-conclude',
                  )
                  .map(([summaryIndex]) => summaryIndex);

                for (const summaryIndex of summaryPartIndices) {
                  controller.enqueue({
                    type: 'reasoning-end',
                    id: `${value.item.id}:${summaryIndex}`,
                    providerMetadata: {
                      [providerOptionsName]: {
                        itemId: value.item.id,
                        reasoningEncryptedContent:
                          value.item.encrypted_content ?? null,
                      } satisfies ResponsesReasoningProviderMetadata,
                    },
                  });
                }

                delete activeReasoning[value.item.id];
              } else if (value.item.type === 'compaction') {
                controller.enqueue({
                  type: 'custom',
                  kind: 'openai.compaction',
                  providerMetadata: {
                    [providerOptionsName]: {
                      type: 'compaction',
                      itemId: value.item.id,
                      encryptedContent: value.item.encrypted_content,
                    } satisfies ResponsesCompactionProviderMetadata,
                  },
                });
              }
            } else if (isResponseFunctionCallArgumentsDeltaChunk(value)) {
              const toolCall = ongoingToolCalls[value.output_index];

              if (toolCall != null) {
                controller.enqueue({
                  type: 'tool-input-delta',
                  id: toolCall.toolCallId,
                  delta: value.delta,
                });
              }
            } else if (isResponseCustomToolCallInputDeltaChunk(value)) {
              const toolCall = ongoingToolCalls[value.output_index];

              if (toolCall != null) {
                controller.enqueue({
                  type: 'tool-input-delta',
                  id: toolCall.toolCallId,
                  delta: value.delta,
                });
              }
            } else if (isResponseApplyPatchCallOperationDiffDeltaChunk(value)) {
              const toolCall = ongoingToolCalls[value.output_index];

              if (toolCall?.applyPatch) {
                controller.enqueue({
                  type: 'tool-input-delta',
                  id: toolCall.toolCallId,
                  delta: escapeJSONDelta(value.delta),
                });

                toolCall.applyPatch.hasDiff = true;
              }
            } else if (isResponseApplyPatchCallOperationDiffDoneChunk(value)) {
              const toolCall = ongoingToolCalls[value.output_index];

              if (toolCall?.applyPatch && !toolCall.applyPatch.endEmitted) {
                if (!toolCall.applyPatch.hasDiff) {
                  controller.enqueue({
                    type: 'tool-input-delta',
                    id: toolCall.toolCallId,
                    delta: escapeJSONDelta(value.diff),
                  });

                  toolCall.applyPatch.hasDiff = true;
                }

                controller.enqueue({
                  type: 'tool-input-delta',
                  id: toolCall.toolCallId,
                  delta: '"}}',
                });

                controller.enqueue({
                  type: 'tool-input-end',
                  id: toolCall.toolCallId,
                });

                toolCall.applyPatch.endEmitted = true;
              }
            } else if (isResponseImageGenerationCallPartialImageChunk(value)) {
              controller.enqueue({
                type: 'tool-result',
                toolCallId: value.item_id,
                toolName: toolNameMapping.toCustomToolName('image_generation'),
                result: {
                  result: value.partial_image_b64,
                } satisfies InferSchema<typeof imageGenerationOutputSchema>,
                preliminary: true,
              });
            } else if (isResponseCodeInterpreterCallCodeDeltaChunk(value)) {
              const toolCall = ongoingToolCalls[value.output_index];

              if (toolCall != null) {
                controller.enqueue({
                  type: 'tool-input-delta',
                  id: toolCall.toolCallId,
                  delta: escapeJSONDelta(value.delta),
                });
              }
            } else if (isResponseCodeInterpreterCallCodeDoneChunk(value)) {
              const toolCall = ongoingToolCalls[value.output_index];

              if (toolCall != null) {
                controller.enqueue({
                  type: 'tool-input-delta',
                  id: toolCall.toolCallId,
                  delta: '"}',
                });

                controller.enqueue({
                  type: 'tool-input-end',
                  id: toolCall.toolCallId,
                });

                // 输入结束后立即发送工具调用：
                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: toolCall.toolCallId,
                  toolName:
                    toolNameMapping.toCustomToolName('code_interpreter'),
                  input: JSON.stringify({
                    code: value.code,
                    containerId: toolCall.codeInterpreter!.containerId,
                  } satisfies InferSchema<typeof codeInterpreterInputSchema>),
                  providerExecuted: true,
                });
              }
            } else if (isResponseCreatedChunk(value)) {
              responseId = value.response.id;
              controller.enqueue({
                type: 'response-metadata',
                id: value.response.id,
                timestamp: new Date(value.response.created_at * 1000),
                modelId: value.response.model,
              });
            } else if (isTextDeltaChunk(value)) {
              controller.enqueue({
                type: 'text-delta',
                id: value.item_id,
                delta: value.delta,
              });

              if (
                options.providerOptions?.[providerOptionsName]?.logprobs &&
                value.logprobs
              ) {
                logprobs.push(value.logprobs);
              }
            } else if (value.type === 'response.reasoning_summary_part.added') {
              // 第一个推理开始被推入 isResponseOutputItemAddedReasoningChunk
              if (value.summary_index > 0) {
                const activeReasoningPart = activeReasoning[value.item_id]!;

                activeReasoningPart.summaryParts[value.summary_index] =
                  'active';

                // 由于有一个新的活动摘要部分，我们可以总结所有可以得出结论的摘要部分
                for (const summaryIndex of Object.keys(
                  activeReasoningPart.summaryParts,
                )) {
                  if (
                    activeReasoningPart.summaryParts[summaryIndex] ===
                    'can-conclude'
                  ) {
                    controller.enqueue({
                      type: 'reasoning-end',
                      id: `${value.item_id}:${summaryIndex}`,
                      providerMetadata: {
                        [providerOptionsName]: {
                          itemId: value.item_id,
                        } satisfies ResponsesReasoningProviderMetadata,
                      },
                    });
                    activeReasoningPart.summaryParts[summaryIndex] =
                      'concluded';
                  }
                }

                controller.enqueue({
                  type: 'reasoning-start',
                  id: `${value.item_id}:${value.summary_index}`,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item_id,
                      reasoningEncryptedContent:
                        activeReasoning[value.item_id]?.encryptedContent ??
                        null,
                    } satisfies ResponsesReasoningProviderMetadata,
                  },
                });
              }
            } else if (value.type === 'response.reasoning_summary_text.delta') {
              controller.enqueue({
                type: 'reasoning-delta',
                id: `${value.item_id}:${value.summary_index}`,
                delta: value.delta,
                providerMetadata: {
                  [providerOptionsName]: {
                    itemId: value.item_id,
                  } satisfies ResponsesReasoningProviderMetadata,
                },
              });
            } else if (value.type === 'response.reasoning_summary_part.done') {
              // 当OpenAI存储消息数据时，我们可以立即得出推理部分
              // 因为我们不需要发送加密的内容。
              if (store) {
                controller.enqueue({
                  type: 'reasoning-end',
                  id: `${value.item_id}:${value.summary_index}`,
                  providerMetadata: {
                    [providerOptionsName]: {
                      itemId: value.item_id,
                    } satisfies ResponsesReasoningProviderMetadata,
                  },
                });

                // 将摘要部分标记为结论
                activeReasoning[value.item_id]!.summaryParts[
                  value.summary_index
                ] = 'concluded';
              } else {
                // 将摘要部分标记为只能得出结论
                // 因为我们需要有一个包含加密内容的最终摘要部分
                activeReasoning[value.item_id]!.summaryParts[
                  value.summary_index
                ] = 'can-conclude';
              }
            } else if (isResponseFinishedChunk(value)) {
              finishReason = {
                unified: mapOpenAIResponseFinishReason({
                  finishReason: value.response.incomplete_details?.reason,
                  hasFunctionCall,
                }),
                raw: value.response.incomplete_details?.reason ?? undefined,
              };
              usage = value.response.usage;
              if (typeof value.response.service_tier === 'string') {
                serviceTier = value.response.service_tier;
              }
            } else if (isResponseFailedChunk(value)) {
              const incompleteReason =
                value.response.incomplete_details?.reason;
              finishReason = {
                unified: incompleteReason
                  ? mapOpenAIResponseFinishReason({
                      finishReason: incompleteReason,
                      hasFunctionCall,
                    })
                  : 'error',
                raw: incompleteReason ?? 'error',
              };
              usage = value.response.usage ?? undefined;
            } else if (isResponseAnnotationAddedChunk(value)) {
              ongoingAnnotations.push(value.annotation);
              if (value.annotation.type === 'url_citation') {
                controller.enqueue({
                  type: 'source',
                  sourceType: 'url',
                  id: self.config.generateId?.() ?? generateId(),
                  url: value.annotation.url,
                  title: value.annotation.title,
                });
              } else if (value.annotation.type === 'file_citation') {
                controller.enqueue({
                  type: 'source',
                  sourceType: 'document',
                  id: self.config.generateId?.() ?? generateId(),
                  mediaType: 'text/plain',
                  title: value.annotation.filename,
                  filename: value.annotation.filename,
                  providerMetadata: {
                    [providerOptionsName]: {
                      type: value.annotation.type,
                      fileId: value.annotation.file_id,
                      index: value.annotation.index,
                    } satisfies Extract<
                      ResponsesSourceDocumentProviderMetadata,
                      { type: 'file_citation' }
                    >,
                  },
                });
              } else if (value.annotation.type === 'container_file_citation') {
                controller.enqueue({
                  type: 'source',
                  sourceType: 'document',
                  id: self.config.generateId?.() ?? generateId(),
                  mediaType: 'text/plain',
                  title: value.annotation.filename,
                  filename: value.annotation.filename,
                  providerMetadata: {
                    [providerOptionsName]: {
                      type: value.annotation.type,
                      fileId: value.annotation.file_id,
                      containerId: value.annotation.container_id,
                    } satisfies Extract<
                      ResponsesSourceDocumentProviderMetadata,
                      { type: 'container_file_citation' }
                    >,
                  },
                });
              } else if (value.annotation.type === 'file_path') {
                controller.enqueue({
                  type: 'source',
                  sourceType: 'document',
                  id: self.config.generateId?.() ?? generateId(),
                  mediaType: 'application/octet-stream',
                  title: value.annotation.file_id,
                  filename: value.annotation.file_id,
                  providerMetadata: {
                    [providerOptionsName]: {
                      type: value.annotation.type,
                      fileId: value.annotation.file_id,
                      index: value.annotation.index,
                    } satisfies Extract<
                      ResponsesSourceDocumentProviderMetadata,
                      { type: 'file_path' }
                    >,
                  },
                });
              }
            } else if (isErrorChunk(value)) {
              controller.enqueue({ type: 'error', error: value });
            }
          },

          flush(controller) {
            const providerMetadata: SharedV4ProviderMetadata = {
              [providerOptionsName]: {
                responseId: responseId,
                ...(logprobs.length > 0 ? { logprobs } : {}),
                ...(serviceTier !== undefined ? { serviceTier } : {}),
              } satisfies ResponsesProviderMetadata,
            };

            controller.enqueue({
              type: 'finish',
              finishReason,
              usage: convertOpenAIResponsesUsage(usage),
              providerMetadata,
            });
          },
        }),
      ),
      request: { body },
      response: { headers: responseHeaders },
    };
  }
}

function isTextDeltaChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & { type: 'response.output_text.delta' } {
  return chunk.type === 'response.output_text.delta';
}

function isResponseOutputItemDoneChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & { type: 'response.output_item.done' } {
  return chunk.type === 'response.output_item.done';
}

function isResponseFinishedChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & {
  type: 'response.completed' | 'response.incomplete';
} {
  return (
    chunk.type === 'response.completed' || chunk.type === 'response.incomplete'
  );
}

function isResponseFailedChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & { type: 'response.failed' } {
  return chunk.type === 'response.failed';
}

function isResponseCreatedChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & { type: 'response.created' } {
  return chunk.type === 'response.created';
}

function isResponseFunctionCallArgumentsDeltaChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & {
  type: 'response.function_call_arguments.delta';
} {
  return chunk.type === 'response.function_call_arguments.delta';
}

function isResponseCustomToolCallInputDeltaChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & {
  type: 'response.custom_tool_call_input.delta';
} {
  return chunk.type === 'response.custom_tool_call_input.delta';
}

function isResponseImageGenerationCallPartialImageChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & {
  type: 'response.image_generation_call.partial_image';
} {
  return chunk.type === 'response.image_generation_call.partial_image';
}

function isResponseCodeInterpreterCallCodeDeltaChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & {
  type: 'response.code_interpreter_call_code.delta';
} {
  return chunk.type === 'response.code_interpreter_call_code.delta';
}

function isResponseCodeInterpreterCallCodeDoneChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & {
  type: 'response.code_interpreter_call_code.done';
} {
  return chunk.type === 'response.code_interpreter_call_code.done';
}

function isResponseApplyPatchCallOperationDiffDeltaChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesApplyPatchOperationDiffDeltaChunk {
  return chunk.type === 'response.apply_patch_call_operation_diff.delta';
}

function isResponseApplyPatchCallOperationDiffDoneChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesApplyPatchOperationDiffDoneChunk {
  return chunk.type === 'response.apply_patch_call_operation_diff.done';
}

function isResponseOutputItemAddedChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & { type: 'response.output_item.added' } {
  return chunk.type === 'response.output_item.added';
}

function isResponseAnnotationAddedChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & {
  type: 'response.output_text.annotation.added';
} {
  return chunk.type === 'response.output_text.annotation.added';
}

function isErrorChunk(
  chunk: OpenAIResponsesChunk,
): chunk is OpenAIResponsesChunk & { type: 'error' } {
  return chunk.type === 'error';
}

function mapWebSearchOutput(
  action: OpenAIResponsesWebSearchAction | null | undefined,
): InferSchema<typeof webSearchOutputSchema> {
  if (action == null) {
    return {};
  }

  switch (action.type) {
    case 'search':
      return {
        action: { type: 'search', query: action.query ?? undefined },
        // 当响应 API 提供时包含源（包含标志后面）
        ...(action.sources != null && { sources: action.sources }),
      };
    case 'open_page':
      return { action: { type: 'openPage', url: action.url } };
    case 'find_in_page':
      return {
        action: {
          type: 'findInPage',
          url: action.url,
          pattern: action.pattern,
        },
      };
  }
}

// 增量嵌入在 JSON 字符串中。
// 为了转义它，我们使用 JSON.stringify 和 slice 来删除外部引号。
function escapeJSONDelta(delta: string) {
  return JSON.stringify(delta).slice(1, -1);
}
