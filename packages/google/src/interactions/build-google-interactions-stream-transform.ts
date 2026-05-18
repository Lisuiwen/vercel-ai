import type {
  JSONValue,
  LanguageModelV4FinishReason,
  LanguageModelV4Source,
  LanguageModelV4StreamPart,
  SharedV4ProviderMetadata,
  SharedV4Warning,
} from '@ai-sdk/provider';
import type { ParseResult } from '@ai-sdk/provider-utils';
import type {
  GoogleInteractionsEvent,
  GoogleInteractionsUsage,
} from './google-interactions-api';
import { convertGoogleInteractionsUsage } from './convert-google-interactions-usage';
import {
  annotationsToSources,
  builtinToolResultToSources,
} from './extract-google-interactions-sources';
import { mapGoogleInteractionsFinishReason } from './map-google-interactions-finish-reason';
import type {
  GoogleInteractionsAnnotation,
  GoogleInteractionsBuiltinToolResultContent,
  GoogleInteractionsStatus,
} from './google-interactions-prompt';

const BUILTIN_TOOL_CALL_TYPES = new Set([
  'google_search_call',
  'code_execution_call',
  'url_context_call',
  'file_search_call',
  'google_maps_call',
  'mcp_server_tool_call',
]);

const BUILTIN_TOOL_RESULT_TYPES = new Set([
  'google_search_result',
  'code_execution_result',
  'url_context_result',
  'file_search_result',
  'google_maps_result',
  'mcp_server_tool_result',
]);

function builtinToolNameFromCallType(type: string): string {
  return type.replace(/_call$/, '');
}

function builtinToolNameFromResultType(type: string): string {
  return type.replace(/_result$/, '');
}

type OpenBlockState =
  | { kind: 'text'; id: string; emittedSourceKeys: Set<string> }
  | {
      kind: 'reasoning';
      id: string;
      signature?: string;
    }
  | {
      kind: 'image';
      id: string;
      data?: string;
      mimeType?: string;
      uri?: string;
    }
  | {
      kind: 'function_call';
      id: string;
      toolCallId: string;
      toolName: string;
      /**
       * 部分 JSON 参数的累加器。参数流作为
       * `step.delta` 上的 `arguments_delta` 子字符串序列；每一个都是
       * 逐字附加并作为“工具输入增量”出现。开
       * `step.stop` 累积的字符串被解析以恢复完整的
       * 最终“工具调用”事件的参数对象。
       */
      argumentsAccum: string;
      signature?: string;
    }
  | {
      kind: 'builtin_tool_call';
      id: string;
      blockType: string;
      toolCallId: string;
      toolName: string;
      arguments: Record<string, unknown>;
      callEmitted: boolean;
    }
  | {
      kind: 'builtin_tool_result';
      id: string;
      blockType: string;
      callId: string;
      toolName: string;
      result: unknown;
      isError?: boolean;
      resultEmitted: boolean;
    }
  /**
   * 一个“model_output”步骤，其内部内容块类型尚未确定
   * 已消除歧义。 `step.start` 可能是裸露的 (`{type: 'model_output'}`,
   * 无内容负载）；第一个“step.delta”揭示了该块是否
   * 是文本或图像。区块在此过渡状态下打开并交换
   * 到第一个匹配的增量上的“文本”/“图像”。
   */
  | { kind: 'pending_model_output'; id: string }
  | { kind: 'unknown'; id: string };

/**
 * 构建一个 `TransformStream<ParseResult<GoogleInteractionsEvent>, LanguageModelV4StreamPart>`
 * 通过交互 API SSE 事件流。
 *
 * 表面文字+思维（推理）、函数调用、图像、内置工具
 * 调用/结果步骤，以及 `text_annotation` -> `source` 部分。
 */
export function buildGoogleInteractionsStreamTransform({
  warnings,
  generateId,
  includeRawChunks,
  serviceTier: headerServiceTier,
}: {
  warnings: Array<SharedV4Warning>;
  generateId: () => string;
  includeRawChunks?: boolean;
  /**
   * 从“x-gemini-service-tier”读取的服务层的防御后备
   * HTTP 响应标头。 Interactions API 展示了应用层
   * `interaction.completed` 事件主体（参见下面的 `service_tier`）；这个
   * 参数存在，因此如果 API 稍后启动，我们仍然会显示一个层
   * 发送标头。
   */
  serviceTier?: string;
}): TransformStream<
  ParseResult<GoogleInteractionsEvent>,
  LanguageModelV4StreamPart
> {
  let interactionId: string | undefined;
  let usage: GoogleInteractionsUsage | undefined;
  let serviceTier: string | undefined = headerServiceTier;
  let finishStatus: GoogleInteractionsStatus | string | undefined;
  let hasFunctionCall = false;

  /*
   * 每个索引打开步骤槽。 Interactions API 框架并发步骤
   * （例如，文本与思想）通过“index”；我们跟踪每个空位
   * 独立，因此索引 N 处的文本增量永远不会与想法发生冲突
   * 索引 M 处的增量。
   */
  const openBlocks = new Map<number, OpenBlockState>();

  /*
   * 消除整个流中的重复源。引用经常重新出现
   * 随着模型文本的增长跨越多个“text_annotation”增量；
   * 每个唯一的 URL 都会显示一次。
   */
  const emittedSourceKeys = new Set<string>();

  function sourceKey(source: LanguageModelV4Source): string {
    return source.sourceType === 'url'
      ? `url:${source.url}`
      : `doc:${source.filename ?? source.title}`;
  }

  return new TransformStream<
    ParseResult<GoogleInteractionsEvent>,
    LanguageModelV4StreamPart
  >({
    start(controller) {
      controller.enqueue({ type: 'stream-start', warnings });
    },

    transform(chunk, controller) {
      if (includeRawChunks) {
        controller.enqueue({ type: 'raw', rawValue: chunk.rawValue });
      }

      if (!chunk.success) {
        finishStatus = 'failed';
        controller.enqueue({ type: 'error', error: chunk.error });
        return;
      }

      const value = chunk.value;
      const eventType = (value as { event_type?: string }).event_type;

      switch (eventType) {
        case 'interaction.created': {
          const event = value as Extract<
            GoogleInteractionsEvent,
            { event_type: 'interaction.created' }
          >;
          const interaction = event.interaction;
          /*
           * Interactions API 在流式传输中返回 `id: ""`（空字符串）
           * 使用“store: false”运行时的事件 - 没有服务器端
           * 记录。将空字符串视为丢失，因此providerMetadata
           * 保持干净。
           */
          interactionId =
            interaction?.id != null && interaction.id.length > 0
              ? interaction.id
              : undefined;

          const created = (interaction as { created?: string } | undefined)
            ?.created;
          let timestamp: Date | undefined;
          if (typeof created === 'string') {
            const parsed = new Date(created);
            if (!Number.isNaN(parsed.getTime())) {
              timestamp = parsed;
            }
          }

          controller.enqueue({
            type: 'response-metadata',
            ...(interactionId != null ? { id: interactionId } : {}),
            modelId: (interaction as { model?: string } | undefined)?.model,
            ...(timestamp ? { timestamp } : {}),
          });
          break;
        }

        case 'step.start': {
          const event = value as Extract<
            GoogleInteractionsEvent,
            { event_type: 'step.start' }
          >;
          const step = event.step as
            | {
                type?: string;
                id?: string;
                call_id?: string;
                name?: string;
                arguments?: Record<string, unknown>;
                signature?: string;
                summary?: Array<{ type?: string; text?: string }>;
                result?: unknown;
                is_error?: boolean;
                content?: Array<{
                  type?: string;
                  text?: string;
                  data?: string;
                  mime_type?: string;
                  uri?: string;
                  annotations?: Array<GoogleInteractionsAnnotation>;
                }>;
              }
            | undefined;
          const index = event.index;
          const blockId = `${interactionId ?? 'interaction'}:${index}`;
          const stepType = step?.type;

          if (stepType === 'model_output') {
            /*
             * “model_output”步骤的“step.start”通常只包含
             * 类型鉴别器 - 内容/图像有效负载然后到达
             * 随后的“step.delta”事件。过渡期开放
             * `pending_model_output` 状态；第一个三角洲将其提升为
             * “text”（并发出“text-start”）或“image”。
             *
             * `step.content[0]` 也可能会作为提示填充；当
             * 呈现，踊跃推广。
             */
            const initial = step?.content?.[0] as
              | {
                  type?: string;
                  text?: string;
                  data?: string;
                  mime_type?: string;
                  uri?: string;
                  annotations?: Array<GoogleInteractionsAnnotation>;
                }
              | undefined;
            if (initial?.type === 'text') {
              openBlocks.set(index, {
                kind: 'text',
                id: blockId,
                emittedSourceKeys: new Set<string>(),
              });
              controller.enqueue({ type: 'text-start', id: blockId });

              const initialSources = annotationsToSources({
                annotations: initial.annotations,
                generateId,
              });
              for (const source of initialSources) {
                const key = sourceKey(source);
                if (emittedSourceKeys.has(key)) continue;
                emittedSourceKeys.add(key);
                controller.enqueue(source);
              }
            } else if (initial?.type === 'image') {
              openBlocks.set(index, {
                kind: 'image',
                id: blockId,
                ...(initial.data != null ? { data: initial.data } : {}),
                ...(initial.mime_type != null
                  ? { mimeType: initial.mime_type }
                  : {}),
                ...(initial.uri != null ? { uri: initial.uri } : {}),
              });
            } else {
              openBlocks.set(index, {
                kind: 'pending_model_output',
                id: blockId,
              });
            }
          } else if (stepType === 'thought') {
            const signature = step?.signature;
            openBlocks.set(index, {
              kind: 'reasoning',
              id: blockId,
              ...(signature != null ? { signature } : {}),
            });
            controller.enqueue({ type: 'reasoning-start', id: blockId });
            /*
             * “想法”步骤的初始“summary[]”可能已包含文本
             * `step.start` 上的项目 — 将它们作为推理增量发出，以便
             * 消费者的推理缓冲区在任何增量之前都是最新的
             * 到达。
             */
            if (Array.isArray(step?.summary)) {
              for (const item of step.summary) {
                if (item?.type === 'text' && typeof item.text === 'string') {
                  controller.enqueue({
                    type: 'reasoning-delta',
                    id: blockId,
                    delta: item.text,
                  });
                }
              }
            }
          } else if (stepType === 'function_call') {
            const toolCallId = step?.id ?? blockId;
            const toolName = step?.name ?? 'unknown';
            hasFunctionCall = true;
            const state: Extract<OpenBlockState, { kind: 'function_call' }> = {
              kind: 'function_call',
              id: blockId,
              toolCallId,
              toolName,
              argumentsAccum: '',
              ...(step?.signature != null ? { signature: step.signature } : {}),
            };
            openBlocks.set(index, state);
            controller.enqueue({
              type: 'tool-input-start',
              id: toolCallId,
              toolName,
            });
          } else if (
            stepType != null &&
            BUILTIN_TOOL_CALL_TYPES.has(stepType)
          ) {
            const toolName =
              stepType === 'mcp_server_tool_call'
                ? (step?.name ?? 'mcp_server_tool')
                : builtinToolNameFromCallType(stepType);
            const toolCallId = step?.id ?? blockId;
            const state: Extract<
              OpenBlockState,
              { kind: 'builtin_tool_call' }
            > = {
              kind: 'builtin_tool_call',
              id: blockId,
              blockType: stepType,
              toolCallId,
              toolName,
              arguments: step?.arguments ?? {},
              callEmitted: false,
            };
            openBlocks.set(index, state);
          } else if (
            stepType != null &&
            BUILTIN_TOOL_RESULT_TYPES.has(stepType)
          ) {
            const toolName =
              stepType === 'mcp_server_tool_result'
                ? (step?.name ?? 'mcp_server_tool')
                : builtinToolNameFromResultType(stepType);
            const callId = step?.call_id ?? blockId;
            const state: Extract<
              OpenBlockState,
              { kind: 'builtin_tool_result' }
            > = {
              kind: 'builtin_tool_result',
              id: blockId,
              blockType: stepType,
              callId,
              toolName,
              result: step?.result ?? null,
              ...(step?.is_error != null ? { isError: step.is_error } : {}),
              resultEmitted: false,
            };
            openBlocks.set(index, state);
          } else {
            openBlocks.set(index, { kind: 'unknown', id: blockId });
          }
          break;
        }

        case 'step.delta': {
          const event = value as Extract<
            GoogleInteractionsEvent,
            { event_type: 'step.delta' }
          >;
          let open = openBlocks.get(event.index);
          if (open == null) break;

          const dtype = (event.delta as { type?: string } | undefined)?.type;

          /*
           * 第一个将待处理的 model_output 块提升为“text”
           * 文本形状的三角洲。图像增量在下面内联发出 - a
           * model_output 步骤可以交错文本和图像增量，因此
           * 文本“开放块”在图像发射中保持在原位
           * 被交换为图像状态。
           */
          if (open.kind === 'pending_model_output') {
            if (
              dtype === 'text' ||
              dtype === 'text_annotation' ||
              dtype === 'text_annotation_delta'
            ) {
              const promoted: Extract<OpenBlockState, { kind: 'text' }> = {
                kind: 'text',
                id: open.id,
                emittedSourceKeys: new Set<string>(),
              };
              openBlocks.set(event.index, promoted);
              open = promoted;
              controller.enqueue({ type: 'text-start', id: promoted.id });
            }
          }

          /*
           * “model_output”内的图像增量携带完整的有效负载
           * 单块（无每字节流）。将“文件”部分发出为
           * 三角洲一到达，无论是否出现，它都会浮出水面
           * 当前在同一索引处打开了一个文本块。
           */
          if (
            dtype === 'image' &&
            (open.kind === 'pending_model_output' ||
              open.kind === 'text' ||
              open.kind === 'image')
          ) {
            const img = event.delta as
              | { data?: string; mime_type?: string; uri?: string }
              | undefined;
            const google: Record<string, string> = {};
            if (interactionId != null) google.interactionId = interactionId;
            const providerMetadata =
              Object.keys(google).length > 0 ? { google } : undefined;
            if (img?.data != null && img.data.length > 0) {
              controller.enqueue({
                type: 'file',
                mediaType: img.mime_type ?? 'image/png',
                data: { type: 'data', data: img.data },
                ...(providerMetadata ? { providerMetadata } : {}),
              });
            } else if (img?.uri != null && img.uri.length > 0) {
              controller.enqueue({
                type: 'file',
                mediaType: img.mime_type ?? 'image/png',
                data: { type: 'url', url: new URL(img.uri) },
                ...(providerMetadata ? { providerMetadata } : {}),
              });
            }
            // 文件部分是内联发出的；清除上的所有数据
            // 急切升级的图像 OpenBlockState 因此“step.stop”
            // 处理程序不会发出重复项。
            if (open.kind === 'image') {
              open.data = undefined;
              open.uri = undefined;
            }
            break;
          }

          const delta = event.delta as
            | {
                type?: string;
                text?: string;
                signature?: string;
                content?: { type?: string; text?: string };
                id?: string;
                /*
                 * 每个 delta 类型的“arguments”具有不同的形状：
                 * - `type: 'arguments_delta'` → `string` (部分 JSON)
                 * - `类型：'<内置>_tool_call'` → `记录<字符串，未知>`
                 * 分支处理程序使用匹配的类型读取它。
                 */
                arguments?: Record<string, unknown> | string;
                annotations?: Array<GoogleInteractionsAnnotation>;
                call_id?: string;
                result?: unknown;
                is_error?: boolean;
                data?: string;
                mime_type?: string;
                uri?: string;
                name?: string;
              }
            | undefined;

          if (open.kind === 'text' && delta?.type === 'text') {
            const text = delta.text ?? '';
            if (text.length > 0) {
              controller.enqueue({
                type: 'text-delta',
                id: open.id,
                delta: text,
              });
            }
          } else if (
            open.kind === 'text' &&
            (delta?.type === 'text_annotation' ||
              delta?.type === 'text_annotation_delta')
          ) {
            const sources = annotationsToSources({
              annotations: delta.annotations,
              generateId,
            });
            for (const source of sources) {
              const key = sourceKey(source);
              if (emittedSourceKeys.has(key)) continue;
              emittedSourceKeys.add(key);
              open.emittedSourceKeys.add(key);
              controller.enqueue(source);
            }
          } else if (open.kind === 'image' && delta?.type === 'image') {
            if (delta.data != null) open.data = delta.data;
            if (delta.mime_type != null) open.mimeType = delta.mime_type;
            if (delta.uri != null) open.uri = delta.uri;
          } else if (open.kind === 'reasoning') {
            if (delta?.type === 'thought_summary') {
              const item = delta.content;
              if (item?.type === 'text' && typeof item.text === 'string') {
                controller.enqueue({
                  type: 'reasoning-delta',
                  id: open.id,
                  delta: item.text,
                });
              }
            } else if (delta?.type === 'thought_signature') {
              const signature = delta.signature;
              if (signature != null) {
                open.signature = signature;
              }
            }
          } else if (
            open.kind === 'function_call' &&
            delta?.type === 'arguments_delta'
          ) {
            /*
             * 部分 JSON 参数作为“arguments_delta”事件到达。
             * 部分 JSON 字符串位于“delta.arguments”（一个字符串，
             * 不是解析的对象 - `arguments_delta` 名称适用于
             * 仅判别器）。附加到累加器和表面
             * 每个块作为“工具输入增量”；完整的参数对象
             * 在“step.stop”处发出。
             */
            const slice =
              typeof delta.arguments === 'string' ? delta.arguments : '';
            if (slice.length > 0) {
              open.argumentsAccum += slice;
              controller.enqueue({
                type: 'tool-input-delta',
                id: open.toolCallId,
                delta: slice,
              });
            }
            if (delta.id != null) {
              open.toolCallId = delta.id;
            }
            if (delta.signature != null) {
              open.signature = delta.signature;
            }
            hasFunctionCall = true;
          } else if (
            open.kind === 'builtin_tool_call' &&
            delta?.type === open.blockType
          ) {
            if (delta.id != null) open.toolCallId = delta.id;
            if (
              delta.arguments != null &&
              typeof delta.arguments === 'object'
            ) {
              open.arguments = delta.arguments;
            }
            if (
              delta.name != null &&
              open.blockType === 'mcp_server_tool_call'
            ) {
              open.toolName = delta.name;
            }
          } else if (
            open.kind === 'builtin_tool_result' &&
            delta?.type === open.blockType
          ) {
            if (delta.call_id != null) open.callId = delta.call_id;
            if (delta.result !== undefined) open.result = delta.result;
            if (delta.is_error != null) open.isError = delta.is_error;
            if (
              delta.name != null &&
              open.blockType === 'mcp_server_tool_result'
            ) {
              open.toolName = delta.name;
            }
          }
          break;
        }

        case 'step.stop': {
          const event = value as Extract<
            GoogleInteractionsEvent,
            { event_type: 'step.stop' }
          >;
          const open = openBlocks.get(event.index);
          if (open == null) break;

          if (open.kind === 'text') {
            const textProviderMetadata =
              interactionId != null ? { google: { interactionId } } : undefined;
            controller.enqueue({
              type: 'text-end',
              id: open.id,
              ...(textProviderMetadata
                ? { providerMetadata: textProviderMetadata }
                : {}),
            });
          } else if (open.kind === 'reasoning') {
            const google: Record<string, string> = {};
            if (open.signature != null) google.signature = open.signature;
            if (interactionId != null) google.interactionId = interactionId;
            const providerMetadata =
              Object.keys(google).length > 0 ? { google } : undefined;
            controller.enqueue({
              type: 'reasoning-end',
              id: open.id,
              ...(providerMetadata ? { providerMetadata } : {}),
            });
          } else if (open.kind === 'image') {
            const google: Record<string, string> = {};
            if (interactionId != null) google.interactionId = interactionId;
            const providerMetadata =
              Object.keys(google).length > 0 ? { google } : undefined;
            if (open.data != null && open.data.length > 0) {
              controller.enqueue({
                type: 'file',
                mediaType: open.mimeType ?? 'image/png',
                data: { type: 'data', data: open.data },
                ...(providerMetadata ? { providerMetadata } : {}),
              });
            } else if (open.uri != null && open.uri.length > 0) {
              controller.enqueue({
                type: 'file',
                mediaType: open.mimeType ?? 'image/png',
                data: { type: 'url', url: new URL(open.uri) },
                ...(providerMetadata ? { providerMetadata } : {}),
              });
            }
          } else if (open.kind === 'function_call') {
            const accumulated =
              open.argumentsAccum.length > 0 ? open.argumentsAccum : '{}';
            controller.enqueue({
              type: 'tool-input-end',
              id: open.toolCallId,
            });
            const google: Record<string, string> = {};
            if (open.signature != null) google.signature = open.signature;
            if (interactionId != null) google.interactionId = interactionId;
            const providerMetadata =
              Object.keys(google).length > 0 ? { google } : undefined;
            controller.enqueue({
              type: 'tool-call',
              toolCallId: open.toolCallId,
              toolName: open.toolName,
              input: accumulated,
              ...(providerMetadata ? { providerMetadata } : {}),
            });
          } else if (open.kind === 'builtin_tool_call' && !open.callEmitted) {
            controller.enqueue({
              type: 'tool-call',
              toolCallId: open.toolCallId,
              toolName: open.toolName,
              input: JSON.stringify(open.arguments ?? {}),
              providerExecuted: true,
            });
            open.callEmitted = true;
          } else if (
            open.kind === 'builtin_tool_result' &&
            !open.resultEmitted
          ) {
            controller.enqueue({
              type: 'tool-result',
              toolCallId: open.callId,
              toolName: open.toolName,
              result: (open.result ?? null) as NonNullable<JSONValue>,
            });
            open.resultEmitted = true;

            const sources = builtinToolResultToSources({
              block: {
                type: open.blockType,
                call_id: open.callId,
                result: open.result,
              } as unknown as GoogleInteractionsBuiltinToolResultContent,
              generateId,
            });
            for (const source of sources) {
              const key = sourceKey(source);
              if (emittedSourceKeys.has(key)) continue;
              emittedSourceKeys.add(key);
              controller.enqueue(source);
            }
          }
          openBlocks.delete(event.index);
          break;
        }

        case 'interaction.status_update':
        case 'interaction.in_progress':
        case 'interaction.requires_action': {
          const event = value as Extract<
            GoogleInteractionsEvent,
            {
              event_type:
                | 'interaction.status_update'
                | 'interaction.in_progress'
                | 'interaction.requires_action';
            }
          >;
          if (event.status != null) {
            finishStatus = event.status;
          } else if (eventType === 'interaction.requires_action') {
            finishStatus = 'requires_action';
          } else {
            finishStatus = 'in_progress';
          }
          break;
        }

        case 'interaction.completed': {
          const event = value as Extract<
            GoogleInteractionsEvent,
            { event_type: 'interaction.completed' }
          >;
          const interaction = event.interaction as {
            id?: string;
            status?: GoogleInteractionsStatus;
            usage?: GoogleInteractionsUsage;
            service_tier?: string;
          };
          if (interaction?.id != null && interaction.id.length > 0) {
            interactionId = interaction.id;
          }
          if (interaction?.status != null) {
            finishStatus = interaction.status;
          }
          if (interaction?.usage != null) {
            usage = interaction.usage;
          }
          /*
           * Interactions API 展示了应用的服务层
           * `interaction.completed.interaction.service_tier`（不在
           * `x-gemini-service-tier` HTTP 标头，`:generateContent`
           * 用途）。身体胜过头部后备。
           */
          if (interaction?.service_tier != null) {
            serviceTier = interaction.service_tier;
          }
          break;
        }

        case 'error': {
          const event = value as Extract<
            GoogleInteractionsEvent,
            { event_type: 'error' }
          >;
          finishStatus = 'failed';
          const errorPayload = event.error ?? {
            message: 'Unknown interaction error',
          };
          controller.enqueue({ type: 'error', error: errorPayload });
          break;
        }

        default:
          break;
      }
    },

    flush(controller) {
      const finishReason: LanguageModelV4FinishReason = {
        unified: mapGoogleInteractionsFinishReason({
          status: finishStatus,
          hasFunctionCall,
        }),
        raw: finishStatus,
      };

      const providerMetadata: SharedV4ProviderMetadata = {
        google: {
          ...(interactionId != null ? { interactionId } : {}),
          ...(serviceTier != null ? { serviceTier } : {}),
        },
      };

      controller.enqueue({
        type: 'finish',
        finishReason,
        usage: convertGoogleInteractionsUsage(usage),
        providerMetadata,
      });
    },
  });
}
