/**
 * 语言模型完成生成响应的原因。
 *
 * 包含统一的完成原因和来自提供商的原始完成原因。
 * 统一的完成原因用于在不同的提供商之间提供一致的完成原因。
 * 原始完成原因用于提供来自提供商的原始完成原因。
 */
export type LanguageModelV3FinishReason = {
  /**
   * 统一完成原因。这使得不同提供商能够使用相同的完成原因。
   *
   * 可以是以下之一：
   * - `stop`：模型生成的停止序列
   * - `length`：模型生成的最大令牌数
   * - `content-filter`：内容过滤器违规停止了模型
   * - `tool-calls`：模型触发的工具调用
   * - `error`：模型因错误而停止
   * - `other`：模型因其他原因停止
   */
  unified:
    | 'stop'
    | 'length'
    | 'content-filter'
    | 'tool-calls'
    | 'error'
    | 'other';

  /**
   * 来自提供商的原始完成原因。
   * 这是提供商最初的结束原因。
   */
  raw: string | undefined;
};
