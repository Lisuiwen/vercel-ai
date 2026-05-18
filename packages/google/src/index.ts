export type { GoogleErrorData } from './google-error';
export type {
  GoogleLanguageModelOptions,
  /* * @deprecated 使用 `GoogleLanguageModelOptions` 代替。 */
  GoogleLanguageModelOptions as GoogleGenerativeAIProviderOptions,
} from './google-language-model-options';
export type {
  GoogleProviderMetadata,
  /* * @deprecated 使用 `GoogleProviderMetadata` 代替。 */
  GoogleProviderMetadata as GoogleGenerativeAIProviderMetadata,
} from './google-prompt';
export type {
  GoogleImageModelOptions,
  /* * @deprecated 使用 `GoogleImageModelOptions` 代替。 */
  GoogleImageModelOptions as GoogleGenerativeAIImageProviderOptions,
} from './google-image-model-options';
export type {
  GoogleEmbeddingModelOptions,
  /* * @deprecated 使用 `GoogleEmbeddingModelOptions` 代替。 */
  GoogleEmbeddingModelOptions as GoogleGenerativeAIEmbeddingProviderOptions,
} from './google-embedding-model-options';
export type {
  GoogleVideoModelOptions,
  /* * @deprecated 使用 `GoogleVideoModelOptions` 代替。 */
  GoogleVideoModelOptions as GoogleGenerativeAIVideoProviderOptions,
} from './google-video-model-options';
export type {
  GoogleVideoModelId,
  /* * @deprecated 使用 `GoogleVideoModelId` 代替。 */
  GoogleVideoModelId as GoogleGenerativeAIVideoModelId,
} from './google-video-settings';
export type { GoogleFilesUploadOptions } from './google-files';
export type {
  GoogleLanguageModelInteractionsOptions,
  GoogleInteractionsModelId,
} from './interactions/google-interactions-language-model-options';
export type { GoogleInteractionsProviderMetadata } from './interactions/google-interactions-provider-metadata';
export type { GoogleInteractionsAgentName } from './interactions/google-interactions-agent';
export {
  createGoogle,
  google,
  /* * @deprecated 使用 `createGoogle` 代替。 */
  createGoogle as createGoogleGenerativeAI,
} from './google-provider';
export type {
  GoogleProvider,
  GoogleProviderSettings,
  /* * @deprecated 使用 `GoogleProvider` 代替。 */
  GoogleProvider as GoogleGenerativeAIProvider,
  /* * @deprecated 使用 `GoogleProviderSettings` 代替。 */
  GoogleProviderSettings as GoogleGenerativeAIProviderSettings,
} from './google-provider';

export { VERSION } from './version';
