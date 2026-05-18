export type OpenAILanguageModelCapabilities = {
  isReasoningModel: boolean;
  systemMessageMode: 'remove' | 'system' | 'developer';
  supportsFlexProcessing: boolean;
  supportsPriorityProcessing: boolean;

  /**
   * 当reasoningEffort为none时允许温度、topP、logProbs。
   */
  supportsNonReasoningParameters: boolean;
};

export function getOpenAILanguageModelCapabilities(
  modelId: string,
): OpenAILanguageModelCapabilities {
  const supportsFlexProcessing =
    modelId.startsWith('o3') ||
    modelId.startsWith('o4-mini') ||
    (modelId.startsWith('gpt-5') && !modelId.startsWith('gpt-5-chat'));

  const supportsPriorityProcessing =
    modelId.startsWith('gpt-4') ||
    (modelId.startsWith('gpt-5') &&
      !modelId.startsWith('gpt-5-nano') &&
      !modelId.startsWith('gpt-5-chat') &&
      !modelId.startsWith('gpt-5.4-nano')) ||
    modelId.startsWith('o3') ||
    modelId.startsWith('o4-mini');

  // 使用白名单方法：只有已知的推理模型才应使用“开发人员”角色
  // 这可以防止微调模型、第三方模型和自定义模型出现问题
  const isReasoningModel =
    modelId.startsWith('o1') ||
    modelId.startsWith('o3') ||
    modelId.startsWith('o4-mini') ||
    (modelId.startsWith('gpt-5') && !modelId.startsWith('gpt-5-chat'));

  // https://platform.openai.com/docs/guides/latest-model#gpt-5-1-parameter-compatibility
  // 当reasoningEffort为none时，GPT-5.1及更高版本的模型系列支持温度、topP、logProbs。
  const supportsNonReasoningParameters =
    modelId.startsWith('gpt-5.1') ||
    modelId.startsWith('gpt-5.2') ||
    modelId.startsWith('gpt-5.3') ||
    modelId.startsWith('gpt-5.4') ||
    modelId.startsWith('gpt-5.5');

  const systemMessageMode = isReasoningModel ? 'developer' : 'system';

  return {
    supportsFlexProcessing,
    supportsPriorityProcessing,
    isReasoningModel,
    systemMessageMode,
    supportsNonReasoningParameters,
  };
}
