import type {
  ImageModelV4Usage,
  JSONObject,
  LanguageModelV4Usage,
} from '@ai-sdk/provider';

/**
 * 表示提示和完成中使用的标记数。
 */
export type LanguageModelUsage = {
  /**
   * 使用的输入（提示）令牌总数。
   */
  inputTokens: number | undefined;

  /**
   * 有关输入标记的详细信息。
   */
  inputTokenDetails: {
    /**
     * 使用的非缓存输入（提示）令牌的数量。
     */
    noCacheTokens: number | undefined;

    /**
     * 读取的缓存输入（提示）令牌的数量。
     */
    cacheReadTokens: number | undefined;

    /**
     * 写入的缓存输入（提示）标记的数量。
     */
    cacheWriteTokens: number | undefined;
  };

  /**
   * 使用的输出（完成）令牌总数。
   */
  outputTokens: number | undefined;

  /**
   * 有关输出标记的详细信息。
   */
  outputTokenDetails: {
    /**
     * 使用的文本标记的数量。
     */
    textTokens: number | undefined;

    /**
     * 使用的推理标记的数量。
     */
    reasoningTokens: number | undefined;
  };

  /**
   * 使用的代币总数。
   */
  totalTokens: number | undefined;

  /**
   * 来自提供商的原始使用信息。
   *
   * 这是提供者返回的形状的使用信息。
   * 它可以包括不属于标准使用信息的附加信息。
   */
  raw?: JSONObject;
};

/**
 * 表示嵌入中使用的令牌数量。
 */
// TODO 在 @ai-sdk/provider 中可用后替换为 EmbeddingModelV4Usage
export type EmbeddingModelUsage = {
  /**
   * 嵌入中使用的令牌数量。
   */
  tokens: number;
};

export function asLanguageModelUsage(
  usage: LanguageModelV4Usage,
): LanguageModelUsage {
  return {
    inputTokens: usage.inputTokens.total,
    inputTokenDetails: {
      noCacheTokens: usage.inputTokens.noCache,
      cacheReadTokens: usage.inputTokens.cacheRead,
      cacheWriteTokens: usage.inputTokens.cacheWrite,
    },
    outputTokens: usage.outputTokens.total,
    outputTokenDetails: {
      textTokens: usage.outputTokens.text,
      reasoningTokens: usage.outputTokens.reasoning,
    },
    totalTokens: addTokenCounts(
      usage.inputTokens.total,
      usage.outputTokens.total,
    ),
    raw: usage.raw,
  };
}

export function createNullLanguageModelUsage(): LanguageModelUsage {
  return {
    inputTokens: undefined,
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokens: undefined,
    outputTokenDetails: {
      textTokens: undefined,
      reasoningTokens: undefined,
    },
    totalTokens: undefined,
    raw: undefined,
  };
}

export function addLanguageModelUsage(
  usage1: LanguageModelUsage,
  usage2: LanguageModelUsage,
): LanguageModelUsage {
  return {
    inputTokens: addTokenCounts(usage1.inputTokens, usage2.inputTokens),
    inputTokenDetails: {
      noCacheTokens: addTokenCounts(
        usage1.inputTokenDetails?.noCacheTokens,
        usage2.inputTokenDetails?.noCacheTokens,
      ),
      cacheReadTokens: addTokenCounts(
        usage1.inputTokenDetails?.cacheReadTokens,
        usage2.inputTokenDetails?.cacheReadTokens,
      ),
      cacheWriteTokens: addTokenCounts(
        usage1.inputTokenDetails?.cacheWriteTokens,
        usage2.inputTokenDetails?.cacheWriteTokens,
      ),
    },
    outputTokens: addTokenCounts(usage1.outputTokens, usage2.outputTokens),
    outputTokenDetails: {
      textTokens: addTokenCounts(
        usage1.outputTokenDetails?.textTokens,
        usage2.outputTokenDetails?.textTokens,
      ),
      reasoningTokens: addTokenCounts(
        usage1.outputTokenDetails?.reasoningTokens,
        usage2.outputTokenDetails?.reasoningTokens,
      ),
    },
    totalTokens: addTokenCounts(usage1.totalTokens, usage2.totalTokens),
  };
}

function addTokenCounts(
  tokenCount1: number | undefined,
  tokenCount2: number | undefined,
): number | undefined {
  return tokenCount1 == null && tokenCount2 == null
    ? undefined
    : (tokenCount1 ?? 0) + (tokenCount2 ?? 0);
}

/**
 * 图像模型调用的使用信息。
 */
export type ImageModelUsage = ImageModelV4Usage;

export function addImageModelUsage(
  usage1: ImageModelUsage,
  usage2: ImageModelUsage,
): ImageModelUsage {
  return {
    inputTokens: addTokenCounts(usage1.inputTokens, usage2.inputTokens),
    outputTokens: addTokenCounts(usage1.outputTokens, usage2.outputTokens),
    totalTokens: addTokenCounts(usage1.totalTokens, usage2.totalTokens),
  };
}
