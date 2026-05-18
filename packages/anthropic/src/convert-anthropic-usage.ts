import type { JSONObject, LanguageModelV4Usage } from '@ai-sdk/provider';

/**
 * 表示使用细分中的单次迭代。
 *
 * - `compaction` / `message`：执行器迭代，按执行器费率计费。
 * - `advisor_message`：顾问子推理，按顾问模型计费
 *   费率。 “model”字段携带顾问模型 ID。顾问代币
 *   不会被计入顶级总计，因为它们的计费价格为
 *   不同的费率；检查此数组以进行顾问成本跟踪。
 */
export type AnthropicUsageIteration =
  | {
      type: 'compaction' | 'message';
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | null;
      cache_read_input_tokens?: number | null;
    }
  | {
      type: 'advisor_message';
      model: string;
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | null;
      cache_read_input_tokens?: number | null;
    };

export type AnthropicUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  /**
   * 当触发压缩或调用顾问工具时，这
   * 数组包含每次采样迭代的使用情况。顶级
   * input_tokens 和 output_tokens 排除压缩迭代使用，
   * 并且 Advisor 的子推理也没有被滚入顶层
   * 总计，因为它以不同的费率计费。使用这个数组
   * 每次迭代成本跟踪。
   */
  iterations?: AnthropicUsageIteration[] | null;
};

export function convertAnthropicUsage({
  usage,
  rawUsage,
}: {
  usage: AnthropicUsage;
  rawUsage?: JSONObject;
}): LanguageModelV4Usage {
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;

  // 当存在迭代时（压缩或顾问），跨执行器求和
  // 迭代以获得真正的执行器总数。顶级 input_tokens
  // 和output_tokens排除压缩使用。顾问（`advisor_message`）
  // 迭代被过滤掉：它们按照顾问模型的费率计费，
  // 不是执行者的，因此它们不属于顶级总数。
  let inputTokens: number;
  let outputTokens: number;

  if (usage.iterations && usage.iterations.length > 0) {
    const executorIterations = usage.iterations.filter(
      iter => iter.type === 'compaction' || iter.type === 'message',
    );

    if (executorIterations.length > 0) {
      const totals = executorIterations.reduce(
        (acc, iter) => ({
          input: acc.input + iter.input_tokens,
          output: acc.output + iter.output_tokens,
        }),
        { input: 0, output: 0 },
      );
      inputTokens = totals.input;
      outputTokens = totals.output;
    } else {
      inputTokens = usage.input_tokens;
      outputTokens = usage.output_tokens;
    }
  } else {
    inputTokens = usage.input_tokens;
    outputTokens = usage.output_tokens;
  }

  return {
    inputTokens: {
      total: inputTokens + cacheCreationTokens + cacheReadTokens,
      noCache: inputTokens,
      cacheRead: cacheReadTokens,
      cacheWrite: cacheCreationTokens,
    },
    outputTokens: {
      total: outputTokens,
      text: undefined,
      reasoning: undefined,
    },
    raw: rawUsage ?? usage,
  };
}
