import type { EmbeddingModelV3 } from '../../embedding-model/v3/embedding-model-v3';
import type { ImageModelV3 } from '../../image-model/v3/image-model-v3';
import type { LanguageModelV3 } from '../../language-model/v3/language-model-v3';
import type { RerankingModelV3 } from '../../reranking-model/v3/reranking-model-v3';
import type { SpeechModelV3 } from '../../speech-model/v3/speech-model-v3';
import type { TranscriptionModelV3 } from '../../transcription-model/v3/transcription-model-v3';

/**
 * 语言、文本嵌入和图像生成模型的提供者。
 */
export interface ProviderV3 {
  readonly specificationVersion: 'v3';

  /**
   * 返回具有给定 id 的语言模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {LanguageModel} The language model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  languageModel(modelId: string): LanguageModelV3;

  /**
   * 返回具有给定 id 的文本嵌入模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {LanguageModel} The language model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  embeddingModel(modelId: string): EmbeddingModelV3;

  /**
   * 返回具有给定 id 的文本嵌入模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {EmbeddingModel} The embedding model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   *
   * @deprecated 请改用“embeddingModel”。
   */
  textEmbeddingModel?(modelId: string): EmbeddingModelV3;

  /**
   * 返回具有给定 id 的图像模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {ImageModel} The image model associated with the id
   */
  imageModel(modelId: string): ImageModelV3;

  /**
   * 返回具有给定 id 的转录模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {TranscriptionModel} The transcription model associated with the id
   */
  transcriptionModel?(modelId: string): TranscriptionModelV3;

  /**
   * 返回具有给定 id 的语音模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {SpeechModel} The speech model associated with the id
   */
  speechModel?(modelId: string): SpeechModelV3;

  /**
   * 返回具有给定 id 的重排序模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {RerankingModel} The reranking model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  rerankingModel?(modelId: string): RerankingModelV3;
}
