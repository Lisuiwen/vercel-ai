import { z } from 'zod/v4';

// https://docs.claude.com/en/docs/about-claude/models/overview
export type AnthropicModelId =
  | 'claude-3-haiku-20240307'
  | 'claude-haiku-4-5-20251001'
  | 'claude-haiku-4-5'
  | 'claude-opus-4-0'
  | 'claude-opus-4-20250514'
  | 'claude-opus-4-1-20250805'
  | 'claude-opus-4-1'
  | 'claude-opus-4-5'
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-0'
  | 'claude-sonnet-4-20250514'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-sonnet-4-5'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'
  | 'claude-opus-4-7'
  | (string & {});

/**
 * 用于文档特定功能的人为文件部分提供程序选项。
 * 这些选项适用于各个文件部分（文档）。
 */
export const anthropicFilePartProviderOptions = z.object({
  /**
   * 本文档的引文配置。
   * 启用后，本文档将在响应中生成引用。
   */
  citations: z
    .object({
      /**
       * 启用对此文档的引用
       */
      enabled: z.boolean(),
    })
    .optional(),

  /**
   * 文档的自定义标题。
   * 如果未提供，将使用文件名。
   */
  title: z.string().optional(),

  /**
   * 有关将传递给模型的文档的上下文
   * 但不用于引用的内容。
   * 对于将文档元数据存储为文本或字符串化 JSON 很有用。
   */
  context: z.string().optional(),
});

export type AnthropicFilePartProviderOptions = z.infer<
  typeof anthropicFilePartProviderOptions
>;

export const anthropicLanguageModelOptions = z.object({
  /**
   * 是否向模型发送推理。
   *
   * 这允许您停用不支持推理输入的模型。
   */
  sendReasoning: z.boolean().optional(),

  /**
   * 确定如何生成结构化输出。
   *
   * - `outputFormat`：使用`output_config.format`参数指定结构化输出格式。
   * - `jsonTool`：使用特殊的“json”工具来指定结构化输出格式。
   * - `auto`：支持时使用“outputFormat”，否则使用“jsonTool”（默认）。
   */
  structuredOutputMode: z.enum(['outputFormat', 'jsonTool', 'auto']).optional(),

  /**
   * 用于启用克劳德扩展思维的配置。
   *
   * 启用后，响应包括思考内容块，显示克劳德在最终答案之前的思考过程。
   * 最低预算需要 1,024 个代币，并计入“max_tokens”限制。
   */
  thinking: z
    .discriminatedUnion('type', [
      z.object({
        /* * 适用于 Sonnet 4.6、Opus 4.6 和更新模型 */
        type: z.literal('adaptive'),
        /**
         * 控制思考内容是否包含在响应中。
         * - `“省略”：存在思维块，但文本为空（Opus 4.7+ 的默认值）。
         * - `“总结”`：返回思考内容。需要查看推理输出。
         */
        display: z.enum(['omitted', 'summarized']).optional(),
      }),
      z.object({
        /* * 适用于 Opus 4.6 之前的模型，但 Sonnet 4.6 仍然支持 */
        type: z.literal('enabled'),
        budgetTokens: z.number().optional(),
      }),
      z.object({
        type: z.literal('disabled'),
      }),
    ])
    .optional(),

  /**
   * 是否在工具使用过程中禁用并行函数调用。默认为 false。
   * 设置为 true 时，Claude 每次响应最多使用一个工具。
   */
  disableParallelToolUse: z.boolean().optional(),

  /**
   * 此消息的缓存控制设置。
   * 请参阅 https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
   */
  cacheControl: z
    .object({
      type: z.literal('ephemeral'),
      ttl: z.union([z.literal('5m'), z.literal('1h')]).optional(),
    })
    .optional(),

  /**
   * 请求中包含的元数据。
   *
   * 有关详细信息，请参阅 https://platform.claude.com/docs/en/api/messages/create 。
   */
  metadata: z
    .object({
      /**
       * 与请求关联的用户的外部标识符。
       *
       * 应该是 UUID、哈希值或其他不透明标识符。
       * 不得包含 PII（姓名、电子邮件、电话号码等）。
       */
      userId: z.string().optional(),
    })
    .optional(),

  /**
   * 此请求中要使用的 MCP 服务器。
   */
  mcpServers: z
    .array(
      z.object({
        type: z.literal('url'),
        name: z.string(),
        url: z.string(),
        authorizationToken: z.string().nullish(),
        toolConfiguration: z
          .object({
            enabled: z.boolean().nullish(),
            allowedTools: z.array(z.string()).nullish(),
          })
          .nullish(),
      }),
    )
    .optional(),

  /**
   * 代理技能配置。技能使克劳德能够执行专门的任务
   * 例如文档处理（PPTX、DOCX、PDF、XLSX）和数据分析。
   * 需要启用代码执行工具。
   */
  container: z
    .object({
      id: z.string().optional(),
      skills: z
        .array(
          z.discriminatedUnion('type', [
            z.object({
              type: z.literal('anthropic'),
              skillId: z.string(),
              version: z.string().optional(),
            }),
            z.object({
              type: z.literal('custom'),
              providerReference: z.record(z.string(), z.string()),
              version: z.string().optional(),
            }),
          ]),
        )
        .optional(),
    })
    .optional(),

  /**
   * 是否启用工具调用输入的细粒度（热切）流
   * 以及请求中每个功能工具的结构化输出。当
   * true（默认值），每个功能工具都会收到默认值
   * `eager_input_streaming: true` 除非明确设置
   * `providerOptions.anthropic.eagerInputStreaming`。
   *
   * @default true
   */
  toolStreaming: z.boolean().optional(),

  /**
   * @default 'high'
   */
  effort: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).optional(),

  /**
   * 代理轮流的任务预算。告知模型总代币预算
   * 可用于当前任务，允许它确定工作的优先顺序并结束
   * 随着预算的消耗而优雅地进行。
   *
   * 仅提供建议 - 不强制执行硬代币限制。
   */
  taskBudget: z
    .object({
      type: z.literal('tokens'),
      total: z.number().int().min(20000),
      remaining: z.number().int().min(0).optional(),
    })
    .optional(),

  /**
   * 启用快速模式以实现更快的推理（输出令牌速度加快 2.5 倍）。
   * 仅支持 claude-opus-4-6。
   */
  speed: z.enum(['fast', 'standard']).optional(),

  /**
   * 控制为此请求运行模型推理的位置。
   *
   * - `“global”`：推理可以在任何可用的地理位置运行（默认）。
   * - `“us”`：推理仅在美国的基础设施中运行。
   *
   * 请参阅 https://platform.claude.com/docs/en/build-with-claude/data-residency
   */
  inferenceGeo: z.enum(['us', 'global']).optional(),

  /**
   * 一组要启用的测试版功能。
   * 如果需要，允许提供商接收完整的“测试版”集。
   */
  anthropicBeta: z.array(z.string()).optional(),

  contextManagement: z
    .object({
      edits: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('clear_tool_uses_20250919'),
            trigger: z
              .discriminatedUnion('type', [
                z.object({
                  type: z.literal('input_tokens'),
                  value: z.number(),
                }),
                z.object({
                  type: z.literal('tool_uses'),
                  value: z.number(),
                }),
              ])
              .optional(),
            keep: z
              .object({
                type: z.literal('tool_uses'),
                value: z.number(),
              })
              .optional(),
            clearAtLeast: z
              .object({
                type: z.literal('input_tokens'),
                value: z.number(),
              })
              .optional(),
            clearToolInputs: z.boolean().optional(),
            excludeTools: z.array(z.string()).optional(),
          }),
          z.object({
            type: z.literal('clear_thinking_20251015'),
            keep: z
              .union([
                z.literal('all'),
                z.object({
                  type: z.literal('thinking_turns'),
                  value: z.number(),
                }),
              ])
              .optional(),
          }),
          z.object({
            type: z.literal('compact_20260112'),
            trigger: z
              .object({
                type: z.literal('input_tokens'),
                value: z.number(),
              })
              .optional(),
            pauseAfterCompaction: z.boolean().optional(),
            instructions: z.string().optional(),
          }),
        ]),
      ),
    })
    .optional(),
});

export type AnthropicLanguageModelOptions = z.infer<
  typeof anthropicLanguageModelOptions
>;
