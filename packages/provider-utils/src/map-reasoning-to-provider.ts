import type {
  LanguageModelV4CallOptions,
  SharedV4Warning,
} from '@ai-sdk/provider';

export type ReasoningLevel = Exclude<
  LanguageModelV4CallOptions['reasoning'],
  'none' | 'provider-default' | undefined
>;

export function isCustomReasoning(
  reasoning: LanguageModelV4CallOptions['reasoning'],
): reasoning is Exclude<
  LanguageModelV4CallOptions['reasoning'],
  'provider-default' | undefined
> {
  return reasoning !== undefined && reasoning !== 'provider-default';
}

/**
 * 使用以下命令将顶级推理级别映射到特定于提供者的工作字符串
 * 给定的努力图。如果推理级别达到，则推送兼容性警告
 * 映射到不同的字符串，或者如果级别不支持则显示不受支持的警告
 * 存在于地图中。
 *
 * @returns The mapped effort string, or `undefined` if the level is not
 *   支持。
 */
export function mapReasoningToProviderEffort<T extends string>({
  reasoning,
  effortMap,
  warnings,
}: {
  reasoning: ReasoningLevel;
  effortMap: Partial<Record<ReasoningLevel, T>>;
  warnings: SharedV4Warning[];
}): T | undefined {
  const mapped = effortMap[reasoning];

  if (mapped == null) {
    warnings.push({
      type: 'unsupported',
      feature: 'reasoning',
      details: `reasoning "${reasoning}" is not supported by this model.`,
    });
    return undefined;
  }

  if (mapped !== reasoning) {
    warnings.push({
      type: 'compatibility',
      feature: 'reasoning',
      details: `reasoning "${reasoning}" is not directly supported by this model. mapped to effort "${mapped}".`,
    });
  }

  return mapped;
}

const DEFAULT_REASONING_BUDGET_PERCENTAGES: Record<ReasoningLevel, number> = {
  minimal: 0.02,
  low: 0.1,
  medium: 0.3,
  high: 0.6,
  xhigh: 0.9,
};

/**
 * 通过乘法将顶级推理级别映射到绝对代币预算
 * 模型的最大输出令牌占预算百分比的百分比
 * 地图。结果夹在 `minReasoningBudget` （默认 1024）和
 * `最大推理预算`。如果级别不支持，则推送不受支持的警告
 * 出现在预算百分比图中。
 *
 * @returns The computed token budget, or `undefined` if the level is not
 *   支持。
 */
export function mapReasoningToProviderBudget({
  reasoning,
  maxOutputTokens,
  maxReasoningBudget,
  minReasoningBudget = 1024,
  budgetPercentages = DEFAULT_REASONING_BUDGET_PERCENTAGES,
  warnings,
}: {
  reasoning: ReasoningLevel;
  maxOutputTokens: number;
  maxReasoningBudget: number;
  minReasoningBudget?: number;
  budgetPercentages?: Partial<Record<ReasoningLevel, number>>;
  warnings: SharedV4Warning[];
}): number | undefined {
  const pct = budgetPercentages[reasoning];

  if (pct == null) {
    warnings.push({
      type: 'unsupported',
      feature: 'reasoning',
      details: `reasoning "${reasoning}" is not supported by this model.`,
    });
    return undefined;
  }

  return Math.min(
    maxReasoningBudget,
    Math.max(minReasoningBudget, Math.round(maxOutputTokens * pct)),
  );
}
