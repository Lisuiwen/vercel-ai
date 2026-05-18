import type { LanguageModelV2 } from '../../language-model/v2/language-model-v2';
import type { LanguageModelV2CallOptions } from '../../language-model/v2/language-model-v2-call-options';

/**
 * LanguageModelV2 的实验中间件。
 * 该类型定义了可用于修改的中间件的结构
 * LanguageModelV2 操作的行为。
 */
export type LanguageModelV2Middleware = {
  /**
   * 中间件规范版本。当前版本使用“v2”。
   */
  middlewareVersion?: 'v2' | undefined; // 向后兼容性

  /**
   * 如果需要，可以覆盖提供者名称。
   * @param options.model - The language model instance.
   */
  overrideProvider?: (options: { model: LanguageModelV2 }) => string;

  /**
   * 如果需要，可以覆盖模型 ID。
   * @param options.model - The language model instance.
   */
  overrideModelId?: (options: { model: LanguageModelV2 }) => string;

  /**
   * 如果需要，可以覆盖支持的 URL。
   * @param options.model - The language model instance.
   */
  overrideSupportedUrls?: (options: {
    model: LanguageModelV2;
  }) => PromiseLike<Record<string, RegExp[]>> | Record<string, RegExp[]>;

  /**
   * 在将参数传递到语言模型之前对其进行转换。
   * @param options - Object containing the type of operation and the parameters.
   * @param options.type - The type of operation ('generate' or 'stream').
   * @param options.params - The original parameters for the language model call.
   * @returns A promise that resolves to the transformed parameters.
   */
  transformParams?: (options: {
    type: 'generate' | 'stream';
    params: LanguageModelV2CallOptions;
    model: LanguageModelV2;
  }) => PromiseLike<LanguageModelV2CallOptions>;

  /**
   * 包装语言模型的生成操作。
   * @param options - Object containing the generate function, parameters, and model.
   * @param options.doGenerate - The original generate function.
   * @param options.doStream - The original stream function.
   * @param options.params - The parameters for the generate call. If the
   * 使用“transformParams”中间件，这将是转换后的参数。
   * @param options.model - The language model instance.
   * @returns A promise that resolves to the result of the generate operation.
   */
  wrapGenerate?: (options: {
    doGenerate: () => ReturnType<LanguageModelV2['doGenerate']>;
    doStream: () => ReturnType<LanguageModelV2['doStream']>;
    params: LanguageModelV2CallOptions;
    model: LanguageModelV2;
  }) => Promise<Awaited<ReturnType<LanguageModelV2['doGenerate']>>>;

  /**
   * 包装语言模型的流操作。
   *
   * @param options - Object containing the stream function, parameters, and model.
   * @param options.doGenerate - The original generate function.
   * @param options.doStream - The original stream function.
   * @param options.params - The parameters for the stream call. If the
   * 使用“transformParams”中间件，这将是转换后的参数。
   * @param options.model - The language model instance.
   * @returns A promise that resolves to the result of the stream operation.
   */
  wrapStream?: (options: {
    doGenerate: () => ReturnType<LanguageModelV2['doGenerate']>;
    doStream: () => ReturnType<LanguageModelV2['doStream']>;
    params: LanguageModelV2CallOptions;
    model: LanguageModelV2;
  }) => PromiseLike<Awaited<ReturnType<LanguageModelV2['doStream']>>>;
};
