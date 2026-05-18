import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/**
 * `top_logprobs` 请求正文参数可以设置为介于
 * 0 和 20 指定每次返回的最有可能的标记数
 * 令牌位置，每个都有一个相关的对数概率。
 *
 * @see https://platform.openai.com/docs/api-reference/responses/create#responses_create-top_logprobs
 */
export const TOP_LOGPROBS_MAX = 20;

export const openaiResponsesReasoningModelIds = [
  'o1',
  'o1-2024-12-17',
  'o3',
  'o3-2025-04-16',
  'o3-mini',
  'o3-mini-2025-01-31',
  'o4-mini',
  'o4-mini-2025-04-16',
  'gpt-5',
  'gpt-5-2025-08-07',
  'gpt-5-codex',
  'gpt-5-mini',
  'gpt-5-mini-2025-08-07',
  'gpt-5-nano',
  'gpt-5-nano-2025-08-07',
  'gpt-5-pro',
  'gpt-5-pro-2025-10-06',
  'gpt-5.1',
  'gpt-5.1-chat-latest',
  'gpt-5.1-codex-mini',
  'gpt-5.1-codex',
  'gpt-5.1-codex-max',
  'gpt-5.2',
  'gpt-5.2-chat-latest',
  'gpt-5.2-pro',
  'gpt-5.2-codex',
  'gpt-5.3-chat-latest',
  'gpt-5.3-codex',
  'gpt-5.4',
  'gpt-5.4-2026-03-05',
  'gpt-5.4-mini',
  'gpt-5.4-mini-2026-03-17',
  'gpt-5.4-nano',
  'gpt-5.4-nano-2026-03-17',
  'gpt-5.4-pro',
  'gpt-5.4-pro-2026-03-05',
  'gpt-5.5',
  'gpt-5.5-2026-04-23',
] as const;

export const openaiResponsesModelIds = [
  'gpt-4.1',
  'gpt-4.1-2025-04-14',
  'gpt-4.1-mini',
  'gpt-4.1-mini-2025-04-14',
  'gpt-4.1-nano',
  'gpt-4.1-nano-2025-04-14',
  'gpt-4o',
  'gpt-4o-2024-05-13',
  'gpt-4o-2024-08-06',
  'gpt-4o-2024-11-20',
  'gpt-4o-audio-preview',
  'gpt-4o-audio-preview-2024-12-17',
  'gpt-4o-search-preview',
  'gpt-4o-search-preview-2025-03-11',
  'gpt-4o-mini-search-preview',
  'gpt-4o-mini-search-preview-2025-03-11',
  'gpt-4o-mini',
  'gpt-4o-mini-2024-07-18',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-1106',
  'gpt-5-chat-latest',
  ...openaiResponsesReasoningModelIds,
] as const;

export type OpenAIResponsesModelId =
  | 'gpt-3.5-turbo-0125'
  | 'gpt-3.5-turbo-1106'
  | 'gpt-3.5-turbo'
  | 'gpt-4.1-2025-04-14'
  | 'gpt-4.1-mini-2025-04-14'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano-2025-04-14'
  | 'gpt-4.1-nano'
  | 'gpt-4.1'
  | 'gpt-4o-2024-05-13'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4o-2024-11-20'
  | 'gpt-4o-mini-2024-07-18'
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gpt-5.1'
  | 'gpt-5.1-2025-11-13'
  | 'gpt-5.1-chat-latest'
  | 'gpt-5.1-codex-mini'
  | 'gpt-5.1-codex'
  | 'gpt-5.1-codex-max'
  | 'gpt-5.2'
  | 'gpt-5.2-2025-12-11'
  | 'gpt-5.2-chat-latest'
  | 'gpt-5.2-pro'
  | 'gpt-5.2-pro-2025-12-11'
  | 'gpt-5.2-codex'
  | 'gpt-5.3-chat-latest'
  | 'gpt-5.3-codex'
  | 'gpt-5.4'
  | 'gpt-5.4-2026-03-05'
  | 'gpt-5.4-mini'
  | 'gpt-5.4-mini-2026-03-17'
  | 'gpt-5.4-nano'
  | 'gpt-5.4-nano-2026-03-17'
  | 'gpt-5.4-pro'
  | 'gpt-5.4-pro-2026-03-05'
  | 'gpt-5.5'
  | 'gpt-5.5-2026-04-23'
  | 'gpt-5-2025-08-07'
  | 'gpt-5-chat-latest'
  | 'gpt-5-codex'
  | 'gpt-5-mini-2025-08-07'
  | 'gpt-5-mini'
  | 'gpt-5-nano-2025-08-07'
  | 'gpt-5-nano'
  | 'gpt-5-pro-2025-10-06'
  | 'gpt-5-pro'
  | 'gpt-5'
  | 'o1-2024-12-17'
  | 'o1'
  | 'o3-2025-04-16'
  | 'o3-mini-2025-01-31'
  | 'o3-mini'
  | 'o3'
  | 'o4-mini'
  | 'o4-mini-2025-04-16'
  | (string & {});

// TODO AI SDK 6：此处使用可选而不是无效
export const openaiLanguageModelResponsesOptionsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 要继续的 OpenAI 对话的 ID。
       * 您必须首先通过 OpenAI API 创建对话。
       * 不能与“previousResponseId”结合使用。
       * 默认为“未定义”。
       * @see https://platform.openai.com/docs/api-reference/conversations/create
       */
      conversation: z.string().nullish(),

      /**
       * 要包含在响应中的额外字段集（高级，通常不需要）。
       * 示例值：“reasoning.encrypted_content”、“file_search_call.results”、“message.output_text.logprobs”。
       */
      include: z
        .array(
          z.enum([
            'reasoning.encrypted_content', // 默认在内部处理，仅对于未知推理模型需要
            'file_search_call.results',
            'message.output_text.logprobs',
          ]),
        )
        .nullish(),

      /**
       * 模型说明。
       * 当使用“previousResponseId”选项继续对话时，它们可用于更改系统或开发人员消息。
       * 默认为“未定义”。
       */
      instructions: z.string().nullish(),

      /**
       * 返回标记的对数概率。包括logprobs会增加
       * 响应大小并可能减慢响应时间。然而，它可以
       * 对于更好地理解模型的行为非常有用。
       *
       * 设置为 true 将返回标记的对数概率
       * 被生成。
       *
       * 设置为数字将返回前 n 个的对数概率
       * 生成的令牌。
       *
       * @see https://platform.openai.com/docs/api-reference/responses/create
       * @see https://cookbook.openai.com/examples/using_logprobs
       */
      logprobs: z
        .union([z.boolean(), z.number().min(1).max(TOP_LOGPROBS_MAX)])
        .optional(),

      /**
       * 响应中可以处理的对内置工具的最大调用总数。
       * 此最大数量适用于所有内置工具调用，而不适用于每个单独的工具。
       * 模型调用工具的任何进一步尝试都将被忽略。
       */
      maxToolCalls: z.number().nullish(),

      /**
       * 与生成一起存储的附加元数据。
       */
      metadata: z.any().nullish(),

      /**
       * 是否使用并行工具调用。默认为“true”。
       */
      parallelToolCalls: z.boolean().nullish(),

      /**
       * 上一个响应的 ID。您可以用它来继续对话。
       * 默认为“未定义”。
       */
      previousResponseId: z.string().nullish(),

      /**
       * 设置缓存键以将此提示与缓存的前缀联系起来，以获得更好的缓存性能。
       */
      promptCacheKey: z.string().nullish(),

      /**
       * 提示缓存的保留策略。
       * - '内存中'：默认值。标准提示缓存行为。
       * -“24h”：扩展提示缓存，使缓存的前缀保持活动状态长达 24 小时。
       *          目前仅适用于5.1系列模型。
       *
       * @default 'in_memory'
       */
      promptCacheRetention: z.enum(['in_memory', '24h']).nullish(),

      /**
       * 推理模型的推理工作。默认为“中”。如果你使用
       * `providerOptions` 设置 `reasoningEffort` 选项，此模型设置将被忽略。
       * 有效值：“无”| '最小' | '低' | '中等' | '高' | 'x高'
       *
       * “reasoningEffort”的“none”类型仅适用于 OpenAI 的 GPT-5.1
       * 模型。此外，“reasoningEffort”的“xhigh”类型仅适用于
       * OpenAI 的 GPT-5.1-Codex-Max 模型。将“reasoningEffort”设置为“none”或“xhigh”且模型不受支持将导致
       * 一个错误。
       */
      reasoningEffort: z.string().nullish(),

      /**
       * 控制模型的推理摘要输出。
       * 设置为“自动”以自动接收最丰富的可用级别，
       * 或“详细”以获得全面的摘要。
       */
      reasoningSummary: z.string().nullish(),

      /**
       * 用于安全监控和跟踪的标识符。
       */
      safetyIdentifier: z.string().nullish(),

      /**
       * 请求的服务层。
       * 设置为“flex”可降低 50% 的处理成本，但代价是增加延迟（适用于 o3、o4-mini 和 gpt-5 模型）。
       * 设置为“优先”，以便通过企业访问加快处理速度（适用于 gpt-4、gpt-5、gpt-5-mini、o3、o4-mini；不支持 gpt-5-nano）。
       *
       * 默认为“自动”。
       */
      serviceTier: z.enum(['auto', 'flex', 'priority', 'default']).nullish(),

      /**
       * 是否存储代。默认为“true”。
       */
      store: z.boolean().nullish(),

      /**
       * 是否将非图像文件类型作为通用输入文件传递。
       *
       * 默认情况下，内联文件输入仅限于图像和 PDF。
       * 当目标 OpenAI Responses 模型支持附加功能时启用此功能
       * 文件媒体类型，例如 text/csv。
       */
      passThroughUnsupportedFiles: z.boolean().optional(),

      /**
       * 是否使用严格的 JSON 模式验证。
       * 默认为“true”。
       */
      strictJsonSchema: z.boolean().nullish(),

      /**
       * 控制模型响应的详细程度。将产生较低的值（“低”）
       * 更简洁的响应，而更高的值（“高”）将导致更详细的响应。
       * 有效值：“低”、“中”、“高”。
       */
      textVerbosity: z.enum(['low', 'medium', 'high']).nullish(),

      /**
       * 控制输出截断。 'auto'（默认）自动执行截断；
       * “disabled”关闭截断。
       */
      truncation: z.enum(['auto', 'disabled']).nullish(),

      /**
       * 代表您的最终用户的唯一标识符，可以帮助 OpenAI
       * 监控和发现滥用行为。
       * 默认为“未定义”。
       * @see https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids
       */
      user: z.string().nullish(),

      /**
       * 覆盖此模型的系统消息模式。
       * -“系统”：对系统消息使用“系统”角色（大多数模型默认）
       * -“开发人员”：对系统消息使用“开发人员”角色（由推理模型使用）
       * -“删除”：完全删除系统消息
       *
       * 如果不指定，则根据模型自动确定模式。
       */
      systemMessageMode: z.enum(['system', 'developer', 'remove']).optional(),

      /**
       * 强制将此模型视为推理模型。
       *
       * 这对于“隐形”推理模型很有用（例如通过自定义 baseURL）
       * 其中 SDK 的白名单无法识别模型 ID。
       *
       * 启用后，SDK 将应用推理模型参数兼容性规则
       * 除非被覆盖，否则默认“systemMessageMode”为“developer”。
       */
      forceReasoning: z.boolean().optional(),

      /**
       * 启用服务器端上下文管理（压缩）。
       */
      contextManagement: z
        .array(
          z.object({
            type: z.literal('compaction'),
            compactThreshold: z.number(),
          }),
        )
        .nullish(),

      /**
       * 将可调用工具限制为子集，同时保留完整工具
       * 列表完好无损，因此在请求之间保留提示缓存
       * 不同的允许名单。
       *
       * 设置后，它将覆盖请求级别的“toolChoice”并发出
       * 线路上的`tool_choice: { type: "allowed_tools", mode, tools }`。
       *
       * @see https://developers.openai.com/api/reference/resources/responses/methods/create#(resource)%20responses%20%3E%20(model)%20tool_choice_allowed%20%3E%20(schema)
       */
      allowedTools: z
        .object({
          toolNames: z.array(z.string()).min(1),
          mode: z.enum(['auto', 'required']).optional(),
        })
        .optional(),
    }),
  ),
);

export type OpenAILanguageModelResponsesOptions = InferSchema<
  typeof openaiLanguageModelResponsesOptionsSchema
>;
