import type { JSONObject } from '../../json-value';

/**
 * 语言模型调用的使用信息。
 */
export type LanguageModelV4Usage = {
  /**
   * 有关输入标记的信息。
   */
  inputTokens: {
    /**
     * 使用的输入（提示）令牌总数。
     */
    total: number | undefined;

    /**
     * 使用的非缓存输入（提示）令牌的数量。
     */
    noCache: number | undefined;

    /**
     * 读取的缓存输入（提示）令牌的数量。
     */
    cacheRead: number | undefined;

    /**
     * 写入的缓存输入（提示）标记的数量。
     */
    cacheWrite: number | undefined;
  };

  /**
   * 有关输出标记的信息。
   */
  outputTokens: {
    /**
     * 使用的输出（完成）令牌总数。
     */
    total: number | undefined;

    /**
     * 使用的文本标记的数量。
     */
    text: number | undefined;

    /**
     * 使用的推理标记的数量。
     */
    reasoning: number | undefined;
  };

  /**
   * 来自提供商的原始使用信息。
   *
   * 这是提供者返回的形状的使用信息。
   * 它可以包括不属于标准使用信息的附加信息。
   */
  raw?: JSONObject;
};
