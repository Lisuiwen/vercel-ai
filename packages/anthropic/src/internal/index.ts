export {
  AnthropicLanguageModel,
  /* * @deprecated 使用 `AnthropicLanguageModel` 代替。 */
  AnthropicLanguageModel as AnthropicMessagesLanguageModel,
  getModelCapabilities,
} from '../anthropic-language-model';
export { anthropicTools } from '../anthropic-tools';
export type {
  AnthropicModelId,
  /* * @deprecated 使用 `AnthropicModelId` 代替。 */
  AnthropicModelId as AnthropicMessagesModelId,
} from '../anthropic-language-model-options';
export { prepareTools } from '../anthropic-prepare-tools';
