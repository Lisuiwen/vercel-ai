import {
  getErrorMessage,
  type LanguageModelV4Prompt,
  type LanguageModelV4StreamPart,
  type SharedV4Headers,
} from '@ai-sdk/provider';
import {
  createIdGenerator,
  type Arrayable,
  type Experimental_Sandbox as Sandbox,
  type IdGenerator,
  type InferToolSetContext,
  type ModelMessage,
  type ProviderOptions,
  type ToolSet,
} from '@ai-sdk/provider-utils';
import { ToolCallNotFoundForApprovalError } from '../error/tool-call-not-found-for-approval-error';
import { resolveLanguageModel } from '../model/resolve-model';
import type { Instructions, Prompt } from '../prompt';
import { convertToLanguageModelPrompt } from '../prompt/convert-to-language-model-prompt';
import type { LanguageModelCallOptions } from '../prompt/language-model-call-options';
import { prepareToolChoice } from '../prompt/prepare-tool-choice';
import { prepareTools } from '../prompt/prepare-tools';
import { standardizePrompt } from '../prompt/standardize-prompt';
import type {
  CallWarning,
  FinishReason,
  LanguageModel,
  ToolChoice,
} from '../types/language-model';
import type { ProviderMetadata } from '../types/provider-metadata';
import { asLanguageModelUsage, type LanguageModelUsage } from '../types/usage';
import {
  createAsyncIterableStream,
  type AsyncIterableStream,
} from '../util/async-iterable-stream';
import type { DownloadFunction } from '../util/download/download-function';
import { notify } from '../util/notify';
import { now as originalNow } from '../util/now';
import { calculateTokensPerSecond } from './calculate-tokens-per-second';
import type { ContentPart } from './content-part';
import { DefaultGeneratedFileWithType } from './generated-file';
import type {
  OnLanguageModelCallEndCallback,
  OnLanguageModelCallStartCallback,
} from './language-model-events';
import type { Output } from './output';
import { parseToolCall } from './parse-tool-call';
import type {
  TextStreamFilePart,
  TextStreamPart,
  TextStreamReasoningDeltaPart,
  TextStreamReasoningFilePart,
  TextStreamTextDeltaPart,
  TextStreamToolApprovalRequestPart,
  TextStreamToolApprovalResponsePart,
  TextStreamToolCallPart,
  TextStreamToolErrorPart,
  TextStreamToolResultPart,
} from './stream-text-result';
import { sumTokenCounts } from './sum-token-counts';
import type { TypedToolCall } from './tool-call';
import type { ToolCallRepairFunction } from './tool-call-repair-function';
import type { TypedToolError } from './tool-error';
import type { ToolInputRefinement } from './tool-input-refinement';
import type { TypedToolResult } from './tool-result';

const originalGenerateId = createIdGenerator({
  prefix: 'aitxt',
  size: 24,
});

const originalGenerateCallId = createIdGenerator({
  prefix: 'call',
  size: 24,
});

export type LanguageModelStreamPart<TOOLS extends ToolSet = ToolSet> =
  | Exclude<
      TextStreamPart<TOOLS>,
      {
        type:
          | 'finish'
          | 'stream-start'
          | 'tool-output-denied'
          | 'start-step'
          | 'finish-step'
          | 'start'
          | 'abort';
      }
    >
  | TextStreamTextDeltaPart
  | TextStreamReasoningDeltaPart
  | TextStreamFilePart
  | TextStreamReasoningFilePart
  | TextStreamToolApprovalRequestPart<TOOLS>
  | TextStreamToolApprovalResponsePart<TOOLS>
  | TextStreamToolCallPart<TOOLS>
  | TextStreamToolResultPart<TOOLS>
  | TextStreamToolErrorPart<TOOLS>
  | {
      type: 'model-call-end';
      finishReason: FinishReason;
      rawFinishReason: string | undefined;
      usage: LanguageModelUsage;
      providerMetadata?: ProviderMetadata;
      performance: {
        responseTimeMs: number;
        effectiveOutputTokensPerSecond: number;
        outputTokensPerSecond: number | undefined;
        inputTokensPerSecond: number | undefined;
        effectiveTotalTokensPerSecond: number;
        timeToFirstOutputTokenMs: number | undefined;
      };
    }
  | {
      type: 'model-call-start';
      warnings: Array<CallWarning>;
    }
  | {
      type: 'model-call-response-metadata';

      /**
       * 生成的响应的 ID（如果提供商发送了响应）。
       */
      id?: string;

      /**
       * 生成的响应的开始时间戳（如果提供者发送响应）。
       */
      timestamp?: Date;

      /**
       * 用于生成响应的响应模型的 ID（如果提供者发送了响应模型）。
       */
      modelId?: string;
    };

/**
 * 在标准化提示和工具后流式传输单一语言模型调用。
 *
 * 返回的流发出模型调用部分以及请求和响应
 * 元数据（如果可用）。
 *
 * @param model - The language model to use.
 * @param tools - Tools that are accessible to and can be called by the model. The model needs to support calling tools.
 * @param output - Output configuration that controls the response format requested from the model.
 * @param toolChoice - The tool choice strategy for the model call.
 *
 * @param system - A system message that will be part of the prompt.
 * @param prompt - A simple text prompt. You can either use `prompt` or `messages` but not both.
 * @param messages - A list of messages. You can either use `prompt` or `messages` but not both.
 * @param allowSystemInMessages - Whether system messages are allowed in the `prompt` or `messages` fields. Default: false.
 *
 * @param maxOutputTokens - Maximum number of tokens to generate.
 * @param temperature - Temperature setting.
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置“温度”或“topP”，但不能同时设置两者。
 * @param topP - Nucleus sampling.
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置“温度”或“topP”，但不能同时设置两者。
 * @param topK - Only sample from the top K options for each subsequent token.
 * 用于删除“长尾”低概率响应。
 * 仅推荐用于高级用例。通常您只需要使用温度。
 * @param presencePenalty - Presence penalty setting.
 * 它会影响模型重复提示中已有信息的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param frequencyPenalty - Frequency penalty setting.
 * 它影响模型重复使用相同单词或短语的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param stopSequences - Stop sequences.
 * 如果设置，模型将在生成停止序列之一时停止生成文本。
 * @param seed - The seed (integer) to use for random sampling.
 * 如果模型设置并支持，调用将生成确定性结果。
 * @param reasoning - Reasoning configuration for the model call.
 *
 * @param download - A function that downloads URLs as part of prompt conversion.
 * @param abortSignal - An optional abort signal that can be used to cancel the call.
 * @param headers - Additional HTTP headers to be sent with the request.
 * @param includeRawChunks - Whether to include raw provider stream chunks in the model stream.
 * @param providerOptions - Additional provider-specific options.
 * @param repairToolCall - A function that can repair invalid tool calls before they are emitted.
 * @param refineToolInput - Optional mapping of tool names to functions that refine parsed tool inputs before they are emitted, used for telemetry, or executed.
 * @param onStart - A callback that receives the fully converted prompt before the model call starts.
 *
 * @returns A stream of model call parts together with request and response metadata when available.
 */
export async function streamLanguageModelCall<
  TOOLS extends ToolSet,
  OUTPUT extends Output = Output,
>({
  model,
  tools,
  output,
  toolChoice,
  prompt,
  system,
  instructions,
  messages,
  allowSystemInMessages,
  download,
  abortSignal,
  headers,
  includeRawChunks,
  providerOptions,
  repairToolCall,
  refineToolInput,
  callId,
  toolsContext,
  experimental_sandbox: sandbox,
  _internal: {
    generateId = originalGenerateId,
    generateCallId = originalGenerateCallId,
    now = originalNow,
  } = {},
  onStart,
  onLanguageModelCallStart,
  onLanguageModelCallEnd,
  ...callSettings
}: {
  model: LanguageModel;
  tools?: TOOLS;
  output?: OUTPUT;
  toolChoice?: ToolChoice<TOOLS>;
  download?: DownloadFunction;
  abortSignal?: AbortSignal;
  headers?: Record<string, string | undefined>;
  includeRawChunks?: boolean;
  providerOptions?: ProviderOptions;
  repairToolCall?: ToolCallRepairFunction<TOOLS> | undefined;
  refineToolInput?: ToolInputRefinement<TOOLS> | undefined;
  callId?: string;
  /**
   * 用于解析每次调用工具元数据（例如函数）的工具上下文
   * 将工具发送到模型之前的描述。
   */
  toolsContext?: InferToolSetContext<TOOLS>;
  /**
   * 沙盒通过来解析依赖于它的工具描述。
   */
  experimental_sandbox?: Sandbox;
  _internal?: {
    generateId?: IdGenerator;
    generateCallId?: IdGenerator;
    now?: () => number;
  };
  onLanguageModelCallStart?: Arrayable<OnLanguageModelCallStartCallback>;
  onLanguageModelCallEnd?: Arrayable<OnLanguageModelCallEndCallback<TOOLS>>;

  // 目前需要 onStart，因为遥测回调需要
  // LanguageModelV4Prompt，我们最多只需要一次下载 URL。
  // 因此convertToLanguageModelPrompt只能被调用一次
  // 每一步和生成的 LanguageModelV4Prompt 需要是
  // 传递给 onStart 回调。
  //
  // TODO 通过更改遥测回调以接受来探索解耦
  // 提示或标准化提示。
  onStart?: (args: {
    promptMessages: LanguageModelV4Prompt;
  }) => Promise<void> | void;
} & Prompt &
  LanguageModelCallOptions): Promise<{
  stream: AsyncIterableStream<LanguageModelStreamPart<TOOLS>>;
  request?: {
    /**
     * 请求发送到提供商 API 的 HTTP 正文。
     */
    body?: unknown;
  };
  response?: {
    /**
     * 响应标头。
     */
    headers?: SharedV4Headers;
  };
}> {
  const resolvedModel = resolveLanguageModel(model);
  const effectiveCallId = callId ?? generateCallId();

  const standardizedPrompt = await standardizePrompt({
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
  } as Prompt);

  const promptMessages = await convertToLanguageModelPrompt({
    prompt: {
      instructions: standardizedPrompt.instructions,
      messages: standardizedPrompt.messages,
    },
    supportedUrls: await resolvedModel.supportedUrls,
    download,
    provider: resolvedModel.provider.split('.')[0],
  });

  const stepTools = await prepareTools({
    tools,
    toolsContext,
    experimental_sandbox: sandbox,
  });

  const stepToolChoice = prepareToolChoice({
    toolChoice,
  });

  await notify({
    event: { promptMessages },
    callbacks: onStart,
  });

  await notify({
    event: {
      callId: effectiveCallId,
      provider: resolvedModel.provider,
      modelId: resolvedModel.modelId,
      instructions: standardizedPrompt.instructions,
      messages: standardizedPrompt.messages,
      tools: stepTools,
      ...callSettings,
    },
    callbacks: onLanguageModelCallStart,
  });

  const callStartTimestampMs = now();

  const {
    stream: languageModelStream,
    response,
    request,
  } = await resolvedModel.doStream({
    ...callSettings,
    tools: stepTools,
    toolChoice: stepToolChoice,
    responseFormat: await output?.responseFormat,
    prompt: promptMessages,
    providerOptions,
    abortSignal,
    headers,
    includeRawChunks,
  });

  const standardizedStream = languageModelStream.pipeThrough(
    createLanguageModelV4StreamPartToLanguageModelStreamPartTransform({
      tools,
      instructions: standardizedPrompt.instructions,
      messages: standardizedPrompt.messages,
      repairToolCall,
      refineToolInput,
      callId: effectiveCallId,
      provider: resolvedModel.provider,
      modelId: resolvedModel.modelId,
      generateId,
      now,
      callStartTimestampMs,
      onLanguageModelCallEnd,
    }),
  );

  return {
    stream: createAsyncIterableStream(standardizedStream),
    response,
    request,
  };
}

// Java 爱你。
function createLanguageModelV4StreamPartToLanguageModelStreamPartTransform<
  TOOLS extends ToolSet,
>({
  tools,
  instructions,
  messages,
  repairToolCall,
  refineToolInput,
  callId,
  provider,
  modelId,
  generateId,
  now,
  callStartTimestampMs,
  onLanguageModelCallEnd,
}: {
  tools: TOOLS | undefined;
  instructions: Instructions | undefined;
  messages: ModelMessage[];
  repairToolCall: ToolCallRepairFunction<TOOLS> | undefined;
  refineToolInput: ToolInputRefinement<TOOLS> | undefined;
  callId: string;
  provider: string;
  modelId: string;
  generateId: IdGenerator;
  now: () => number;
  callStartTimestampMs: number;
  onLanguageModelCallEnd?: Arrayable<OnLanguageModelCallEndCallback<TOOLS>>;
}) {
  // 跟踪已解析的工具调用，以便提供商发出的批准请求可以引用它们
  // 跟踪提供商端工具结果的工具输入
  const toolCallsByToolCallId = new Map<string, TypedToolCall<TOOLS>>();
  const modelCallContent: Array<ContentPart<TOOLS>> = [];
  const textPartIndexes = new Map<string, number>();
  const reasoningPartIndexes = new Map<string, number>();
  let responseId = generateId();
  let timeToFirstOutputTokenMs: number | undefined;

  return new TransformStream<
    LanguageModelV4StreamPart,
    LanguageModelStreamPart<TOOLS>
  >({
    async transform(chunk, controller) {
      if (timeToFirstOutputTokenMs == null && isChunkWithTokens(chunk)) {
        timeToFirstOutputTokenMs = now() - callStartTimestampMs;
      }

      switch (chunk.type) {
        case 'text-start':
          upsertTextContentPart({
            content: modelCallContent,
            partIndexes: textPartIndexes,
            id: chunk.id,
            type: 'text',
            providerMetadata: chunk.providerMetadata,
          });
          controller.enqueue(chunk);
          break;

        case 'text-delta':
          upsertTextContentPart({
            content: modelCallContent,
            partIndexes: textPartIndexes,
            id: chunk.id,
            type: 'text',
            textDelta: chunk.delta,
            providerMetadata: chunk.providerMetadata,
          });
          controller.enqueue({
            type: 'text-delta',
            id: chunk.id,
            text: chunk.delta,
            providerMetadata: chunk.providerMetadata,
          });
          break;

        case 'text-end':
          upsertTextContentPart({
            content: modelCallContent,
            partIndexes: textPartIndexes,
            id: chunk.id,
            type: 'text',
            providerMetadata: chunk.providerMetadata,
          });
          textPartIndexes.delete(chunk.id);
          controller.enqueue(chunk);
          break;

        case 'reasoning-start':
          upsertTextContentPart({
            content: modelCallContent,
            partIndexes: reasoningPartIndexes,
            id: chunk.id,
            type: 'reasoning',
            providerMetadata: chunk.providerMetadata,
          });
          controller.enqueue(chunk);
          break;

        case 'reasoning-delta':
          upsertTextContentPart({
            content: modelCallContent,
            partIndexes: reasoningPartIndexes,
            id: chunk.id,
            type: 'reasoning',
            textDelta: chunk.delta,
            providerMetadata: chunk.providerMetadata,
          });
          controller.enqueue({
            type: 'reasoning-delta',
            id: chunk.id,
            text: chunk.delta,
            providerMetadata: chunk.providerMetadata,
          });
          break;

        case 'reasoning-end':
          upsertTextContentPart({
            content: modelCallContent,
            partIndexes: reasoningPartIndexes,
            id: chunk.id,
            type: 'reasoning',
            providerMetadata: chunk.providerMetadata,
          });
          reasoningPartIndexes.delete(chunk.id);
          controller.enqueue(chunk);
          break;

        case 'file':
        case 'reasoning-file': {
          const file = new DefaultGeneratedFileWithType({
            data:
              chunk.data.type === 'data'
                ? chunk.data.data
                : chunk.data.url.toString(),
            mediaType: chunk.mediaType,
          });

          modelCallContent.push({
            type: chunk.type,
            file,
            ...(chunk.providerMetadata != null
              ? { providerMetadata: chunk.providerMetadata }
              : {}),
          });

          controller.enqueue({
            type: chunk.type,
            file,
            providerMetadata: chunk.providerMetadata,
          });
          break;
        }

        case 'finish': {
          const usage = asLanguageModelUsage(chunk.usage);
          const responseTimeMs = now() - callStartTimestampMs;
          const performance = {
            responseTimeMs,
            effectiveOutputTokensPerSecond: calculateTokensPerSecond({
              tokens: usage.outputTokens,
              durationMs: responseTimeMs,
            }),
            outputTokensPerSecond:
              timeToFirstOutputTokenMs == null
                ? undefined
                : calculateTokensPerSecond({
                    tokens: usage.outputTokens,
                    durationMs: responseTimeMs - timeToFirstOutputTokenMs,
                  }),
            inputTokensPerSecond:
              timeToFirstOutputTokenMs == null
                ? undefined
                : calculateTokensPerSecond({
                    tokens: usage.inputTokens,
                    durationMs: timeToFirstOutputTokenMs,
                  }),
            effectiveTotalTokensPerSecond: calculateTokensPerSecond({
              tokens: sumTokenCounts(usage.inputTokens, usage.outputTokens),
              durationMs: responseTimeMs,
            }),
            timeToFirstOutputTokenMs,
          };

          await notify({
            event: {
              callId,
              provider,
              modelId,
              finishReason: chunk.finishReason.unified,
              usage,
              content: modelCallContent,
              responseId,
              performance,
            },
            callbacks: onLanguageModelCallEnd,
          });

          controller.enqueue({
            type: 'model-call-end',
            finishReason: chunk.finishReason.unified,
            rawFinishReason: chunk.finishReason.raw,
            usage,
            providerMetadata: chunk.providerMetadata,
            performance,
          });
          break;
        }

        case 'tool-call': {
          try {
            const toolCall = await parseToolCall({
              toolCall: chunk,
              tools,
              repairToolCall,
              refineToolInput,
              instructions,
              messages,
            });

            toolCallsByToolCallId.set(toolCall.toolCallId, toolCall);
            controller.enqueue(toolCall);
            modelCallContent.push(toolCall);

            if (toolCall.invalid) {
              controller.enqueue({
                type: 'tool-error',
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                input: toolCall.input,
                error: getErrorMessage(toolCall.error!),
                dynamic: true,
                title: toolCall.title,
                ...(toolCall.toolMetadata != null
                  ? { toolMetadata: toolCall.toolMetadata }
                  : {}),
              });
              break;
            }
          } catch (error) {
            controller.enqueue({ type: 'error', error });
          }

          break;
        }

        case 'tool-approval-request': {
          const toolCall = toolCallsByToolCallId.get(chunk.toolCallId);

          if (toolCall == null) {
            controller.enqueue({
              type: 'error',
              error: new ToolCallNotFoundForApprovalError({
                toolCallId: chunk.toolCallId,
                approvalId: chunk.approvalId,
              }),
            });
            break;
          }

          const toolApprovalRequest = {
            type: 'tool-approval-request',
            approvalId: chunk.approvalId,
            toolCall,
          } as const;

          controller.enqueue(toolApprovalRequest);
          modelCallContent.push(toolApprovalRequest);
          break;
        }

        case 'tool-result': {
          const toolName = chunk.toolName as keyof TOOLS & string;
          const toolCall = toolCallsByToolCallId.get(chunk.toolCallId);

          const toolResultPart = chunk.isError
            ? ({
                type: 'tool-error',
                toolCallId: chunk.toolCallId,
                toolName,
                input: toolCall?.input,
                providerExecuted: true,
                error: chunk.result,
                dynamic: chunk.dynamic,
                ...(chunk.providerMetadata != null
                  ? { providerMetadata: chunk.providerMetadata }
                  : {}),
                ...(toolCall?.toolMetadata != null
                  ? { toolMetadata: toolCall.toolMetadata }
                  : {}),
              } as TypedToolError<TOOLS>)
            : ({
                type: 'tool-result',
                toolCallId: chunk.toolCallId,
                toolName,
                input: toolCall?.input,
                output: chunk.result,
                providerExecuted: true,
                dynamic: chunk.dynamic,
                ...(chunk.providerMetadata != null
                  ? { providerMetadata: chunk.providerMetadata }
                  : {}),
                ...(toolCall?.toolMetadata != null
                  ? { toolMetadata: toolCall.toolMetadata }
                  : {}),
              } as TypedToolResult<TOOLS>);

          controller.enqueue(toolResultPart);
          modelCallContent.push(toolResultPart);

          break;
        }

        case 'tool-input-start': {
          const tool = tools?.[chunk.toolName];

          controller.enqueue({
            ...chunk,
            dynamic: chunk.dynamic ?? tool?.type === 'dynamic',
            title: tool?.title,
            ...(tool?.metadata != null ? { toolMetadata: tool.metadata } : {}),
          });
          break;
        }

        case 'stream-start': {
          controller.enqueue({
            type: 'model-call-start',
            warnings: chunk.warnings,
          });
          break;
        }

        case 'response-metadata': {
          responseId = chunk.id ?? responseId;

          controller.enqueue({
            type: 'model-call-response-metadata',
            id: chunk.id,
            timestamp: chunk.timestamp,
            modelId: chunk.modelId,
          });
          break;
        }

        default:
          if (chunk.type === 'custom' || chunk.type === 'source') {
            modelCallContent.push(chunk);
          }

          controller.enqueue(chunk);
          break;
      }
    },
  });
}

/**
 * 对于包含生成的输出令牌的流式增量返回 true。
 * 用于测量文本、推理和流工具的首次标记时间
 * 输入。
 */
function isChunkWithTokens(chunk: LanguageModelV4StreamPart): boolean {
  return (
    (chunk.type === 'text-delta' && chunk.delta.length > 0) ||
    (chunk.type === 'reasoning-delta' && chunk.delta.length > 0) ||
    (chunk.type === 'tool-input-delta' && chunk.delta.length > 0)
  );
}

/**
 * 将文本或推理内容部分附加到内容数组中并更新部分索引。
 */
function upsertTextContentPart<TOOLS extends ToolSet>({
  content,
  partIndexes,
  id,
  type,
  textDelta,
  providerMetadata,
}: {
  content: Array<ContentPart<TOOLS>>;
  partIndexes: Map<string, number>;
  id: string;
  type: 'text' | 'reasoning';
  textDelta?: string;
  providerMetadata?: ProviderMetadata;
}) {
  let partIndex = partIndexes.get(id);

  if (partIndex == null) {
    partIndex =
      content.push({
        type,
        text: '',
        ...(providerMetadata != null ? { providerMetadata } : {}),
      }) - 1;
    partIndexes.set(id, partIndex);
  }

  const part = content[partIndex] as {
    text: string;
    providerMetadata?: ProviderMetadata;
  };

  if (textDelta != null) {
    part.text += textDelta;
  }

  if (providerMetadata != null) {
    part.providerMetadata = providerMetadata;
  }
}
