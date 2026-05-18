import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

// https://platform.openai.com/docs/models
export type OpenAIChatModelId =
  | 'o1'
  | 'o1-2024-12-17'
  | 'o3-mini'
  | 'o3-mini-2025-01-31'
  | 'o3'
  | 'o3-2025-04-16'
  | 'o4-mini'
  | 'o4-mini-2025-04-16'
  | 'gpt-4.1'
  | 'gpt-4.1-2025-04-14'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-mini-2025-04-14'
  | 'gpt-4.1-nano'
  | 'gpt-4.1-nano-2025-04-14'
  | 'gpt-4o'
  | 'gpt-4o-2024-05-13'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4o-2024-11-20'
  | 'gpt-4o-audio-preview'
  | 'gpt-4o-audio-preview-2024-12-17'
  | 'gpt-4o-audio-preview-2025-06-03'
  | 'gpt-4o-mini'
  | 'gpt-4o-mini-2024-07-18'
  | 'gpt-4o-mini-audio-preview'
  | 'gpt-4o-mini-audio-preview-2024-12-17'
  | 'gpt-4o-search-preview'
  | 'gpt-4o-search-preview-2025-03-11'
  | 'gpt-4o-mini-search-preview'
  | 'gpt-4o-mini-search-preview-2025-03-11'
  | 'gpt-3.5-turbo-0125'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-1106'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-5'
  | 'gpt-5-2025-08-07'
  | 'gpt-5-mini'
  | 'gpt-5-mini-2025-08-07'
  | 'gpt-5-nano'
  | 'gpt-5-nano-2025-08-07'
  | 'gpt-5-chat-latest'
  | 'gpt-5.1'
  | 'gpt-5.1-2025-11-13'
  | 'gpt-5.1-chat-latest'
  | 'gpt-5.2'
  | 'gpt-5.2-2025-12-11'
  | 'gpt-5.2-chat-latest'
  | 'gpt-5.2-pro'
  | 'gpt-5.2-pro-2025-12-11'
  | 'gpt-5.3-chat-latest'
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
  | (string & {});

export const openaiLanguageModelChatOptions = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 修改指定标记出现在补全中的可能性。
       *
       * 接受映射令牌的 JSON 对象（由它们的令牌 ID 指定）
       * GPT 分词器）转换为从 -100 到 100 的相关偏差值。
       */
      logitBias: z.record(z.coerce.number<string>(), z.number()).optional(),

      /**
       * 返回标记的对数概率。
       *
       * 设置为 true 将返回标记的对数概率
       * 被生成。
       *
       * 设置为数字将返回前 n 个的对数概率
       * 生成的令牌。
       */
      logprobs: z.union([z.boolean(), z.number()]).optional(),

      /**
       * 是否在工具使用过程中启用并行函数调用。默认为 true。
       */
      parallelToolCalls: z.boolean().optional(),

      /**
       * 代表您的最终用户的唯一标识符，可以帮助 OpenAI
       * 监控和发现滥用行为。
       */
      user: z.string().optional(),

      /**
       * 推理模型的推理工作。默认为“中”。
       */
      reasoningEffort: z
        .enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh'])
        .optional(),

      /**
       * 要生成的完成令牌的最大数量。对于推理模型很有用。
       */
      maxCompletionTokens: z.number().optional(),

      /**
       * 是否启用响应 API 中的持久性。
       */
      store: z.boolean().optional(),

      /**
       * 与请求关联的元数据。
       */
      metadata: z.record(z.string().max(64), z.string().max(512)).optional(),

      /**
       * 预测模式的参数。
       */
      prediction: z.record(z.string(), z.any()).optional(),

      /**
       * 请求的服务层。
       * -“自动”：默认服务层。该请求将使用配置中配置的服务层进行处理
       *           项目设置。除非另有配置，否则项目将使用“默认”。
       * -“flex”：处理成本降低 50%，但代价是延迟增加。仅适用于 o3 和 o4-mini 模型。
       * -“优先”：以较高的成本实现更高速的处理和可预测的低延迟。可供企业客户使用。
       * -“默认”：将按照所选模型的标准定价和性能处理请求。
       *
       * @default 'auto'
       */
      serviceTier: z.enum(['auto', 'flex', 'priority', 'default']).optional(),

      /**
       * 是否使用严格的 JSON 模式验证。
       *
       * @default true
       */
      strictJsonSchema: z.boolean().optional(),

      /**
       * 控制模型响应的详细程度。
       * 较低的值将导致更简洁的响应，而较高的值将导致更详细的响应。
       */
      textVerbosity: z.enum(['low', 'medium', 'high']).optional(),

      /**
       * 用于提示缓存的缓存键。允许手动控制提示缓存行为。
       * 对于提高缓存命中率和解决自动缓存问题很有用。
       */
      promptCacheKey: z.string().optional(),

      /**
       * 提示缓存的保留策略。
       * - '内存中'：默认值。标准提示缓存行为。
       * -“24h”：扩展提示缓存，使缓存的前缀保持活动状态长达 24 小时。
       *          目前仅适用于5.1系列模型。
       *
       * @default 'in_memory'
       */
      promptCacheRetention: z.enum(['in_memory', '24h']).optional(),

      /**
       * 用于帮助检测应用程序用户的稳定标识符
       * 这可能违反了 OpenAI 的使用政策。 ID 应该是
       * 唯一标识每个用户的字符串。我们建议散列他们的
       * 用户名或电子邮件地址，以避免向我们发送任何识别信息
       * 信息。
       */
      safetyIdentifier: z.string().optional(),

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
    }),
  ),
);

export type OpenAILanguageModelChatOptions = InferSchema<
  typeof openaiLanguageModelChatOptions
>;
