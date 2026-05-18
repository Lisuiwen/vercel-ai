import type { EmbeddingModel } from './embedding-model';
import type { LanguageModel } from './language-model';
import type { ImageModel } from './image-model';
import type { RerankingModel } from './reranking-model';

/**
 * 语言、文本嵌入和图像模型的提供者。
 */
export type Provider = {
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
  languageModel(modelId: string): LanguageModel;

  /**
   * 返回具有给定 id 的文本嵌入模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {EmbeddingModel} The embedding model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  embeddingModel(modelId: string): EmbeddingModel;

  /**
   * 返回具有给定 id 的图像模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {ImageModel} The image model associated with the id
   */
  imageModel(modelId: string): ImageModel;

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
  rerankingModel(modelId: string): RerankingModel;
};
