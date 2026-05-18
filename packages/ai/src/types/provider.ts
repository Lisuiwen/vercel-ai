import type { EmbeddingModel } from './embedding-model';
import type { LanguageModel } from './language-model';
import type { ImageModel } from './image-model';
import type { RerankingModel } from './reranking-model';

/**
 * 语言、文本嵌入和图像模型的提供者。
 */
export type Provider = {
  /**
   * 返回具有给定id的语言模型。
   * 然后将模型ID传递给提供者函数以获取模型。
   *
   * @param {string} modelId - 要返回的模型的 ID。
   *
   * @returns {LanguageModel} 与 id 关联的语言模型
   *
   * @throws {NoSuchModelError} 如果不存在这样的模型。
   */
  languageModel(modelId: string): LanguageModel;

  /**
   * 返回具有给定 id 的文本嵌入模型。
   * 然后将模型ID传递给提供者函数以获取模型。
   *
   * @param {string} modelId - 要返回的模型的 ID。
   *
   * @returns {EmbeddingModel} 与 id 关联的嵌入模型
   *
   * @throws {NoSuchModelError} 如果不存在这样的模型。
   */
  embeddingModel(modelId: string): EmbeddingModel;

  /**
   * 返回具有给定id的图像模型。
   * 然后将模型ID传递给提供者函数以获取模型。
   *
   * @param {string} modelId - 要返回的模型的 ID。
   *
   * @returns {ImageModel} 与id关联的图像模型
   */
  imageModel(modelId: string): ImageModel;

  /**
   * 返回具有给定id的重排序模型。
   * 然后将模型ID传递给提供者函数以获取模型。
   *
   * @param {string} modelId - 要返回的模型的 ID。
   *
   * @returns {RerankingModel} 与 id 关联的重新排名模型
   *
   * @throws {NoSuchModelError} 如果不存在这样的模型。
   */
  rerankingModel(modelId: string): RerankingModel;
};
