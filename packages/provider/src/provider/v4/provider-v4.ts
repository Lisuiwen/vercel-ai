import type { EmbeddingModelV4 } from '../../embedding-model/v4/embedding-model-v4';
import type { FilesV4 } from '../../files/v4/files-v4';
import type { ImageModelV4 } from '../../image-model/v4/image-model-v4';
import type { LanguageModelV4 } from '../../language-model/v4/language-model-v4';
import type { RerankingModelV4 } from '../../reranking-model/v4/reranking-model-v4';
import type { SpeechModelV4 } from '../../speech-model/v4/speech-model-v4';
import type { TranscriptionModelV4 } from '../../transcription-model/v4/transcription-model-v4';
import type { SkillsV4 } from '../../skills/v4/skills-v4';

/**
 * 语言、文本嵌入和图像生成模型的提供者。
 */
export interface ProviderV4 {
  readonly specificationVersion: 'v4';

  /**
   * 返回具有给定 id 的语言模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {LanguageModelV4} The language model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  languageModel(modelId: string): LanguageModelV4;

  /**
   * 返回具有给定 id 的文本嵌入模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {EmbeddingModelV4} The embedding model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  embeddingModel(modelId: string): EmbeddingModelV4;

  /**
   * 返回具有给定 id 的图像模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {ImageModelV4} The image model associated with the id
   */
  imageModel(modelId: string): ImageModelV4;

  /**
   * 返回具有给定 id 的转录模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {TranscriptionModelV4} The transcription model associated with the id
   */
  transcriptionModel?(modelId: string): TranscriptionModelV4;

  /**
   * 返回具有给定 id 的语音模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {SpeechModelV4} The speech model associated with the id
   */
  speechModel?(modelId: string): SpeechModelV4;

  /**
   * 返回具有给定 id 的重排序模型。
   * 然后将模型 ID 传递给提供者函数以获取模型。
   *
   * @param {string} modelId - The id of the model to return.
   *
   * @returns {RerankingModelV4} The reranking model associated with the id
   *
   * @throws {NoSuchModelError} If no such model exists.
   */
  rerankingModel?(modelId: string): RerankingModelV4;

  /**
   * 返回用于将文件上传到提供者的文件接口。
   * 返回的接口可以传递给`uploadFile`函数。
   *
   * @returns {FilesV4} The files interface for this provider.
   */
  files?(): FilesV4;

  /**
   * 返回用于将技能上传到提供者的技能接口。
   * 返回的接口可以传递给`uploadSkill`函数。
   */
  skills?(): SkillsV4;
}
