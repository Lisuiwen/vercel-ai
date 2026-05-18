/**
 * 语言模型调用的使用信息。
 *
 * 如果您的 API 返回额外的使用信息，您可以将其添加到
 * 您的提供商密钥下的提供商元数据。
 */
export type LanguageModelV2Usage = {
  /**
   * 使用的输入（提示）标记的数量。
   */
  inputTokens: number | undefined;

  /**
   * 使用的输出（完成）标记的数量。
   */
  outputTokens: number | undefined;

  /**
   * 提供商报告的代币总数。
   * 该数字可能与“inputTokens”和“outputTokens”的总和不同
   * 以及例如包括推理标记或其他开销。
   */
  totalTokens: number | undefined;

  /**
   * 使用的推理标记的数量。
   */
  reasoningTokens?: number | undefined;

  /**
   * 缓存的输入令牌的数量。
   */
  cachedInputTokens?: number | undefined;
};
