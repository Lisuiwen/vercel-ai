import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/*
 * Gemini Interactions API 有线格式的 Zod 模式。
 *
 * 助手被定义为工厂（仅在导出的内部调用）
 * `lazySchema(() => ...)` 回调）所以没有 `z.object(...)` / `z.union(...)`
 * 在模块导入时运行。模式故意缩小领域范围
 * SDK 对其余部分进行消耗和宽松（`loose()` / `unknown`），因此后续
 * 可以在不破坏基本路径的情况下扩展扩展。
 */

const tokenByModalitySchema = () =>
  z
    .object({
      modality: z.string().nullish(),
      tokens: z.number().nullish(),
    })
    .loose();

const usageSchema = () =>
  z
    .object({
      total_input_tokens: z.number().nullish(),
      total_output_tokens: z.number().nullish(),
      total_thought_tokens: z.number().nullish(),
      total_cached_tokens: z.number().nullish(),
      total_tool_use_tokens: z.number().nullish(),
      total_tokens: z.number().nullish(),
      input_tokens_by_modality: z.array(tokenByModalitySchema()).nullish(),
      output_tokens_by_modality: z.array(tokenByModalitySchema()).nullish(),
      cached_tokens_by_modality: z.array(tokenByModalitySchema()).nullish(),
      tool_use_tokens_by_modality: z.array(tokenByModalitySchema()).nullish(),
      grounding_tool_count: z
        .array(
          z
            .object({
              type: z.string().nullish(),
              count: z.number().nullish(),
            })
            .loose(),
        )
        .nullish(),
    })
    .loose();

export type GoogleInteractionsUsage = z.infer<ReturnType<typeof usageSchema>>;

const interactionStatusSchema = () =>
  z.enum([
    'in_progress',
    'requires_action',
    'completed',
    'failed',
    'cancelled',
    'incomplete',
  ]);

const annotationSchema = () => {
  const urlCitation = z
    .object({
      type: z.literal('url_citation'),
      url: z.string().nullish(),
      title: z.string().nullish(),
      start_index: z.number().nullish(),
      end_index: z.number().nullish(),
    })
    .loose();

  const fileCitation = z
    .object({
      type: z.literal('file_citation'),
      file_name: z.string().nullish(),
      document_uri: z.string().nullish(),
      url: z.string().nullish(),
      page_number: z.number().nullish(),
      media_id: z.string().nullish(),
      start_index: z.number().nullish(),
      end_index: z.number().nullish(),
      custom_metadata: z.record(z.string(), z.unknown()).nullish(),
    })
    .loose();

  const placeCitation = z
    .object({
      type: z.literal('place_citation'),
      name: z.string().nullish(),
      url: z.string().nullish(),
      place_id: z.string().nullish(),
      start_index: z.number().nullish(),
      end_index: z.number().nullish(),
    })
    .loose();

  return z.union([
    urlCitation,
    fileCitation,
    placeCitation,
    z.object({ type: z.string() }).loose(),
  ]);
};

const thoughtSummaryItemSchema = () =>
  z
    .object({
      type: z.string(),
      text: z.string().nullish(),
      data: z.string().nullish(),
      mime_type: z.string().nullish(),
    })
    .loose();

/*
 * 内容块模式 - 这些填充 a 的“内容”数组
 * `model_output` 步骤。函数调用、思考和内置工具
 * 调用/结果块是顶级步骤类型（请参阅下面的“stepSchema”），而不是
 * 内容块。
 */
const contentBlockSchema = () => {
  const textContent = z
    .object({
      type: z.literal('text'),
      text: z.string(),
      annotations: z.array(annotationSchema()).nullish(),
    })
    .loose();

  const imageContent = z
    .object({
      type: z.literal('image'),
      data: z.string().nullish(),
      mime_type: z.string().nullish(),
      resolution: z.enum(['low', 'medium', 'high', 'ultra_high']).nullish(),
      uri: z.string().nullish(),
    })
    .loose();

  return z.union([
    textContent,
    imageContent,
    z.object({ type: z.string() }).loose(),
  ]);
};

export type GoogleInteractionsContentBlock = z.infer<
  ReturnType<typeof contentBlockSchema>
>;

const BUILTIN_TOOL_CALL_STEP_TYPES = [
  'google_search_call',
  'code_execution_call',
  'url_context_call',
  'file_search_call',
  'google_maps_call',
  'mcp_server_tool_call',
] as const;

const BUILTIN_TOOL_RESULT_STEP_TYPES = [
  'google_search_result',
  'code_execution_result',
  'url_context_result',
  'file_search_result',
  'google_maps_result',
  'mcp_server_tool_result',
] as const;

/*
 * 步骤模式联合 — `response.steps[]` 的元素和 `step` 字段
 * `step.start` SSE 事件。
 *
 * - `user_input` 回显客户端发送的轮次；仅出现在
 *   `GET /interactions/{id}`（完整时间线）。 SDK 会跳过它。
 * - `model_output` 将模型的文本/图像内容包装在 `step.content[]` 中。
 * - `function_call`、`thought` 和内置的 `*_call`/`*_result` 步骤
 *   直接在步骤上携带它们的有效负载（没有“内容”间接）。
 */
const stepSchema = () => {
  const userInputStep = z
    .object({
      type: z.literal('user_input'),
      content: z.array(contentBlockSchema()).nullish(),
    })
    .loose();

  const modelOutputStep = z
    .object({
      type: z.literal('model_output'),
      content: z.array(contentBlockSchema()).nullish(),
    })
    .loose();

  const functionCallStep = z
    .object({
      type: z.literal('function_call'),
      id: z.string(),
      name: z.string(),
      arguments: z.record(z.string(), z.unknown()).nullish(),
      signature: z.string().nullish(),
    })
    .loose();

  const thoughtStep = z
    .object({
      type: z.literal('thought'),
      signature: z.string().nullish(),
      summary: z.array(thoughtSummaryItemSchema()).nullish(),
    })
    .loose();

  const builtinToolCallStep = z
    .object({
      type: z.enum(BUILTIN_TOOL_CALL_STEP_TYPES),
      id: z.string(),
      arguments: z.record(z.string(), z.unknown()).nullish(),
      name: z.string().nullish(),
      server_name: z.string().nullish(),
      search_type: z.string().nullish(),
      signature: z.string().nullish(),
    })
    .loose();

  const builtinToolResultStep = z
    .object({
      type: z.enum(BUILTIN_TOOL_RESULT_STEP_TYPES),
      call_id: z.string(),
      result: z.unknown().nullish(),
      is_error: z.boolean().nullish(),
      name: z.string().nullish(),
      server_name: z.string().nullish(),
      signature: z.string().nullish(),
    })
    .loose();

  return z.union([
    userInputStep,
    modelOutputStep,
    functionCallStep,
    thoughtStep,
    builtinToolCallStep,
    builtinToolResultStep,
    z.object({ type: z.string() }).loose(),
  ]);
};

export type GoogleInteractionsStep = z.infer<ReturnType<typeof stepSchema>>;

export const googleInteractionsResponseSchema = lazySchema(() =>
  zodSchema(
    z
      .object({
        /*
         * 当“store: false”时，响应正文中会省略“id”（完全
         * 无状态模式）——没有服务器端交互记录
         * 供客户参考。 “nullish”让模式接受该形状。
         */
        id: z.string().nullish(),
        created: z.string().nullish(),
        updated: z.string().nullish(),
        status: interactionStatusSchema(),
        model: z.string().nullish(),
        agent: z.string().nullish(),
        steps: z.array(stepSchema()).nullish(),
        usage: usageSchema().nullish(),
        service_tier: z.string().nullish(),
        previous_interaction_id: z.string().nullish(),
        response_modalities: z.array(z.string()).nullish(),
      })
      .loose(),
  ),
);

export type GoogleInteractionsResponse = InferSchema<
  typeof googleInteractionsResponseSchema
>;

export const googleInteractionsEventSchema = lazySchema(() =>
  zodSchema(
    (() => {
      const status = interactionStatusSchema();
      const annotation = annotationSchema();
      const thoughtSummaryItem = thoughtSummaryItemSchema();

      const interactionCreatedEvent = z
        .object({
          event_type: z.literal('interaction.created'),
          event_id: z.string().nullish(),
          interaction: z
            .object({
              /*
               * 当`store: false`时省略`id`（完全无状态模式）；
               * 请参阅“googleInteractionsResponseSchema.id”上的匹配注释。
               */
              id: z.string().nullish(),
              created: z.string().nullish(),
              model: z.string().nullish(),
              agent: z.string().nullish(),
              status: status.nullish(),
            })
            .loose(),
        })
        .loose();

      /*
       * `step.start` 在 `step` 下携带有区别的步骤形状。对于
       * `function_call` 步骤中包含 `name`；为了‘思想’
       * 步骤初始“签名”和“摘要”在设置后到达此处。
       */
      const stepStartEvent = z
        .object({
          event_type: z.literal('step.start'),
          event_id: z.string().nullish(),
          index: z.number(),
          step: stepSchema(),
        })
        .loose();

      const stepDeltaText = z
        .object({
          type: z.literal('text'),
          text: z.string(),
        })
        .loose();

      const stepDeltaThoughtSummary = z
        .object({
          type: z.literal('thought_summary'),
          content: thoughtSummaryItem.nullish(),
        })
        .loose();

      const stepDeltaThoughtSignature = z
        .object({
          type: z.literal('thought_signature'),
          signature: z.string().nullish(),
        })
        .loose();

      /*
       * `function_call` 步骤增量将 JSON 参数作为部分流传输
       * 字符串。线材形状：
       *   { 类型：'arguments_delta'，参数：'<partial-json-string>' }
       * 部分 JSON 位于“arguments”（字符串）中，而不是单独的
       * `arguments_delta` 字段 — 鉴别器名称是唯一的地方
       * 出现“arguments_delta”。消费者累积子串并
       * 解析 `step.stop`。
       */
      const stepDeltaArgumentsDelta = z
        .object({
          type: z.literal('arguments_delta'),
          arguments: z.string().nullish(),
          id: z.string().nullish(),
          signature: z.string().nullish(),
        })
        .loose();

      /*
       * URL/文件/地点引用增量。判别器是
       * `text_annotation_delta` （匹配使用的 `_delta` 后缀
       * `arguments_delta`); `text_annotation` 也被接受作为别名。
       */
      const stepDeltaTextAnnotation = z
        .object({
          type: z.enum(['text_annotation_delta', 'text_annotation']),
          annotations: z.array(annotation).nullish(),
        })
        .loose();

      /*
       * “image”增量携带每个增量的整个有效负载（“data”base64 +
       * `mime_type` 或 `uri`) — 没有每字节流。
       */
      const stepDeltaImage = z
        .object({
          type: z.literal('image'),
          data: z.string().nullish(),
          mime_type: z.string().nullish(),
          resolution: z.enum(['low', 'medium', 'high', 'ultra_high']).nullish(),
          uri: z.string().nullish(),
        })
        .loose();

      /*
       * 内置工具调用/结果步骤增量反映了其步骤的形状
       * 对应物（每个增量的完整有效负载 - 没有每个令牌
       * 参数流）。结果增量携带填充的“结果”
       * 有效负载。
       */
      const stepDeltaBuiltinToolCall = z
        .object({
          type: z.enum(BUILTIN_TOOL_CALL_STEP_TYPES),
          id: z.string().nullish(),
          arguments: z.record(z.string(), z.unknown()).nullish(),
          name: z.string().nullish(),
          server_name: z.string().nullish(),
          search_type: z.string().nullish(),
          signature: z.string().nullish(),
        })
        .loose();

      const stepDeltaBuiltinToolResult = z
        .object({
          type: z.enum(BUILTIN_TOOL_RESULT_STEP_TYPES),
          call_id: z.string().nullish(),
          result: z.unknown().nullish(),
          is_error: z.boolean().nullish(),
          name: z.string().nullish(),
          server_name: z.string().nullish(),
          signature: z.string().nullish(),
        })
        .loose();

      const stepDeltaUnknown = z.object({ type: z.string() }).loose();

      const stepDeltaUnion = z.union([
        stepDeltaText,
        stepDeltaImage,
        stepDeltaThoughtSummary,
        stepDeltaThoughtSignature,
        stepDeltaArgumentsDelta,
        stepDeltaTextAnnotation,
        stepDeltaBuiltinToolCall,
        stepDeltaBuiltinToolResult,
        stepDeltaUnknown,
      ]);

      const stepDeltaEvent = z
        .object({
          event_type: z.literal('step.delta'),
          event_id: z.string().nullish(),
          index: z.number(),
          delta: stepDeltaUnion,
        })
        .loose();

      const stepStopEvent = z
        .object({
          event_type: z.literal('step.stop'),
          event_id: z.string().nullish(),
          index: z.number(),
        })
        .loose();

      /*
       * 状态转换事件。 API 发出“interaction.status_update”
       * 用于正在进行的和需要采取行动的过渡；更具体的
       * `interaction.in_progress` 和 `interaction.requires_action` 形状
       * 被接受，因此所有三个路由都通过同一个处理程序。
       */
      const interactionStatusUpdateEvent = z
        .object({
          event_type: z.literal('interaction.status_update'),
          event_id: z.string().nullish(),
          interaction_id: z.string().nullish(),
          status: status.nullish(),
        })
        .loose();

      const interactionInProgressEvent = z
        .object({
          event_type: z.literal('interaction.in_progress'),
          event_id: z.string().nullish(),
          interaction_id: z.string().nullish(),
          status: status.nullish(),
        })
        .loose();

      const interactionRequiresActionEvent = z
        .object({
          event_type: z.literal('interaction.requires_action'),
          event_id: z.string().nullish(),
          interaction_id: z.string().nullish(),
          status: status.nullish(),
        })
        .loose();

      const interactionCompletedEvent = z
        .object({
          event_type: z.literal('interaction.completed'),
          event_id: z.string().nullish(),
          interaction: z
            .object({
              id: z.string().nullish(),
              status: status.nullish(),
              usage: usageSchema().nullish(),
              service_tier: z.string().nullish(),
            })
            .loose(),
        })
        .loose();

      const errorEvent = z
        .object({
          event_type: z.literal('error'),
          event_id: z.string().nullish(),
          error: z
            .object({
              code: z.string().nullish(),
              message: z.string().nullish(),
            })
            .loose()
            .nullish(),
        })
        .loose();

      const unknownEvent = z.object({ event_type: z.string() }).loose();

      return z.union([
        interactionCreatedEvent,
        stepStartEvent,
        stepDeltaEvent,
        stepStopEvent,
        interactionStatusUpdateEvent,
        interactionInProgressEvent,
        interactionRequiresActionEvent,
        interactionCompletedEvent,
        errorEvent,
        unknownEvent,
      ]);
    })(),
  ),
);

export type GoogleInteractionsEvent = InferSchema<
  typeof googleInteractionsEventSchema
>;
