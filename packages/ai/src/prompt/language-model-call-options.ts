import type { LanguageModelV4CallOptions } from '@ai-sdk/provider';

/**
 * 面向模型的生成控制。这些设置影响模型的方式
 * 生成其响应（令牌限制、采样、惩罚、停止序列、
 * 种子、推理）。
 */
export type LanguageModelCallOptions = {
  /**
   * 生成的最大令牌数。
   */
  maxOutputTokens?: number;

  /**
   * 温度设定。范围取决于提供商和型号。
   *
   * 建议设置“温度”或“topP”，但不能同时设置两者。
   */
  temperature?: number;

  /**
   * 细胞核取样。这是一个 0 到 1 之间的数字。
   *
   * 例如0.1 意味着只有概率质量最高的 10% 的标记
   * 被考虑。
   *
   * 建议设置“温度”或“topP”，但不能同时设置两者。
   */
  topP?: number;

  /**
   * 对于每个后续标记，仅从前 K 个选项中进行采样。
   *
   * 用于删除“长尾”低概率响应。
   * 仅推荐用于高级用例。通常您只需要使用温度。
   */
  topK?: number;

  /**
   * 存在惩罚设置。它影响模型的可能性
   * 重复提示中已有的信息。
   *
   * 存在惩罚是 -1 之间的数字（增加重复）
   * 1（最大惩罚，减少重复）。 0表示没有处罚。
   */
  presencePenalty?: number;

  /**
   * 频率惩罚设置。它影响模型的可能性
   * 重复使用相同的单词或短语。
   *
   * 频率惩罚是 -1 之间的数字（增加重复）
   * 1（最大惩罚，减少重复）。 0表示没有处罚。
   */
  frequencyPenalty?: number;

  /**
   * 停止序列。
   * 如果设置，模型将在生成停止序列之一时停止生成文本。
   * 提供商可能对停止序列的数量有限制。
   */
  stopSequences?: string[];

  /**
   * 用于随机采样的种子（整数）。如果设置并支持
   * 根据模型，调用将生成确定性结果。
   */
  seed?: number;

  /**
   * 模型的推理努力水平。控制推理的多少
   * 模型在生成响应之前执行。
   *
   * 使用“provider-default”来使用提供者的默认推理级别。
   * 使用“none”禁用推理（如果提供者支持）。
   */
  reasoning?: LanguageModelV4CallOptions['reasoning'];
};
