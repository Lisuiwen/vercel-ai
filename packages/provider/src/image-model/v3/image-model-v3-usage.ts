/**
 * 图像模型调用的使用信息。
 */
export type ImageModelV3Usage = {
  /**
   * 使用的输入（提示）标记的数量。
   */
  inputTokens: number | undefined;

  /**
   * 使用的输出令牌的数量（如果提供者报告）。
   */
  outputTokens: number | undefined;

  /**
   * 提供商报告的代币总数。
   */
  totalTokens: number | undefined;
};
