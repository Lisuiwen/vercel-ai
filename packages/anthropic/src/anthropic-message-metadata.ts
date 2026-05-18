import type { JSONObject } from '@ai-sdk/provider';

/**
 * 表示使用细分中的单次迭代。
 *
 * API 返回一个迭代数组，显示每次采样的使用情况
 * 迭代。迭代可以是：
 * - `compaction`：上下文压缩步骤（按执行者费率计费）。
 * - `message`：执行器采样迭代（按执行器费率计费）。
 * - `advisor_message`：顾问子推理（在顾问处计费
 *   模型的费率； `model` 携带顾问模型 ID）。顾问代币
 *   使用量不会计入顶级使用量总计，因为它会计费
 *   以不同的速率；直接检查此数组以进行顾问计费。
 */
export type AnthropicUsageIteration =
  | {
      type: 'compaction' | 'message';

      /**
       * 本次迭代中消耗的输入令牌数量。
       */
      inputTokens: number;

      /**
       * 本次迭代中生成的输出令牌的数量。
       */
      outputTokens: number;

      /**
       * 本次迭代中消耗的缓存创建输入令牌的数量。
       */
      cacheCreationInputTokens?: number;

      /**
       * 本次迭代中消耗的缓存读取输入令牌的数量。
       */
      cacheReadInputTokens?: number;
    }
  | {
      type: 'advisor_message';

      /**
       * 产生本次迭代的顾问模型。
       */
      model: string;

      /**
       * 本次迭代中消耗的输入令牌数量。
       */
      inputTokens: number;

      /**
       * 本次迭代中生成的输出令牌的数量。
       */
      outputTokens: number;

      /**
       * 该顾问程序消耗的缓存创建输入令牌的数量
       * 子推理。当顾问端缓存启用并且
       * Advisor 写入一个新的缓存条目。
       */
      cacheCreationInputTokens?: number;

      /**
       * 该顾问程序消耗的缓存读取输入令牌的数量
       * 子推理。第二次及之后的顾问调用时非零
       * 当顾问端缓存启用时。
       */
      cacheReadInputTokens?: number;
    };

export interface AnthropicMessageMetadata {
  usage: JSONObject;
  stopSequence: string | null;

  /**
   * 触发压缩时按迭代细分的使用情况。
   *
   * 当压缩发生时，该数组包含每次采样迭代的使用情况。
   * 第一次迭代通常是压缩步骤，然后是主要步骤
   * 消息迭代。
   */
  iterations: AnthropicUsageIteration[] | null;

  /**
   * 有关此请求中使用的容器的信息。
   *
   * 如果使用容器工具（例如代码执行），则该值将非空。
   * 有关请求中使用的容器的信息（用于代码执行工具）。
   */
  container: {
    /**
     * 容器过期的时间（RFC3339 时间戳）。
     */
    expiresAt: string;

    /**
     * 此请求中使用的容器的标识符。
     */
    id: string;

    /**
     * 技能加载到容器中。
     */
    skills: Array<{
      /**
       * 技能类型：“人择”（内置）或“自定义”（用户定义）。
       */
      type: 'anthropic' | 'custom';

      /**
       * 技能 ID（1-64 个字符）。
       */
      skillId: string;

      /**
       * 技能版本或“最新”表示最新版本（1-64 个字符）。
       */
      version: string;
    }> | null;
  } | null;

  /**
   * 上下文管理响应。
   *
   * 有关请求期间应用的上下文管理策略的信息。
   */
  contextManagement: {
    /**
     * 已应用的上下文管理编辑的列表。
     * 数组中的每个项目都是特定类型的上下文管理编辑。
     */
    appliedEdits: Array<
      /**
       * 表示清除了一定数量的工具使用和输入标记的编辑。
       */
      | {
          /**
           * 应用的上下文管理编辑的类型。
           * 可能的值：“clear_tool_uses_20250919”
           */
          type: 'clear_tool_uses_20250919';

          /**
           * 通过此编辑清除的工具使用次数。
           * 最小值：0
           */
          clearedToolUses: number;

          /**
           * 此编辑清除的输入标记数。
           * 最小值：0
           */
          clearedInputTokens: number;
        }
      /**
       * 代表一次编辑，其中一定数量的思考轮次和输入标记被清除。
       */
      | {
          /**
           * 应用的上下文管理编辑的类型。
           * 可能的值：“clear_thinking_20251015”
           */
          type: 'clear_thinking_20251015';

          /**
           * 通过此编辑清除的思考轮数。
           * 最小值：0
           */
          clearedThinkingTurns: number;

          /**
           * 此编辑清除的输入标记数。
           * 最小值：0
           */
          clearedInputTokens: number;
        }
      /**
       * 表示对对话上下文进行总结的压缩编辑。
       */
      | {
          /**
           * 应用的上下文管理编辑的类型。
           * 可能的值：'compact_20260112'
           */
          type: 'compact_20260112';
        }
    >;
  } | null;
}
