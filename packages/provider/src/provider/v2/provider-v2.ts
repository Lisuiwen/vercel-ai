import type { EmbeddingModelV2 } from '../../embedding-model/v2/embedding-model-v2';
import type { ImageModelV2 } from '../../image-model/v2/image-model-v2';
import type { LanguageModelV2 } from '../../language-model/v2/language-model-v2';
import type { SpeechModelV2 } from '../../speech-model/v2/speech-model-v2';
import type { TranscriptionModelV2 } from '../../transcription-model/v2/transcription-model-v2';

/**
 * 语言、文本嵌入和图像生成模型的提供者。
 */
export interface ProviderV2 {
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
  languageModel(modelId: string): LanguageModelV2;

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
  textEmbeddingModel(modelId: string): EmbeddingModelV2<string>;

  /**
   * 返回具有给定 id 的图像模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {ImageModel} The image model associated with the id
   */
  imageModel(modelId: string): ImageModelV2;

  /**
   * 返回具有给定 id 的转录模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {TranscriptionModel} The transcription model associated with the id
   */
  transcriptionModel?(modelId: string): TranscriptionModelV2;

  /**
   * 返回具有给定 id 的语音模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {SpeechModel} The speech model associated with the id
   */
  speechModel?(modelId: string): SpeechModelV2;
}
