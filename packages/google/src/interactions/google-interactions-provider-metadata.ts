/**
 * Gemini Interactions 语言模型编写的提供者元数据形状
 * 到 `result.providerMetadata.google` （并从输入消息中读回
 * 下一轮有状态链接和签名往返）。
 */
export type GoogleInteractionsProviderMetadata = {
  /**
   * Gemini 服务器端交互 id (`Interaction.id`)。传回
   * `providerOptions.google.previousInteractionId` 用于链接有状态轮次。
   */
  interactionId?: string;

  /**
   * 用于此交互的服务层（可观察性的直通）。
   */
  serviceTier?: string;

  /**
   * 用于后端验证的每块签名哈希。由 SDK 在输出时设置
   * 推理/工具调用部分和输入部分的往返。
   */
  signature?: string;
};
