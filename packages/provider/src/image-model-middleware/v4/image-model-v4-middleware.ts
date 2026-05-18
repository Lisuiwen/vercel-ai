import type { ImageModelV4 } from '../../image-model/v4/image-model-v4';
import type { ImageModelV4CallOptions } from '../../image-model/v4/image-model-v4-call-options';

/**
 * ImageModelV4 的中间件。
 * 该类型定义了可用于修改的中间件的结构
 * ImageModelV4 操作的行为。
 */
export type ImageModelV4Middleware = {
  /**
   * 中间件规范版本。当前版本使用“v4”。
   */
  readonly specificationVersion: 'v4';

  /**
   * 如果需要，可以覆盖提供者名称。
   * @param options.model - The image model instance.
   */
  overrideProvider?: (options: { model: ImageModelV4 }) => string;

  /**
   * 如果需要，可以覆盖模型 ID。
   * @param options.model - The image model instance.
   */
  overrideModelId?: (options: { model: ImageModelV4 }) => string;

  /**
   * 如果需要，可以覆盖单个 API 调用中可以生成的图像数量的限制。
   * @param options.model - The image model instance.
   */
  overrideMaxImagesPerCall?: (options: {
    model: ImageModelV4;
  }) => ImageModelV4['maxImagesPerCall'];

  /**
   * 在将参数传递到图像模型之前对其进行转换。
   * @param options - Object containing the parameters.
   * @param options.params - The original parameters for the image model call.
   * @returns A promise that resolves to the transformed parameters.
   */
  transformParams?: (options: {
    params: ImageModelV4CallOptions;
    model: ImageModelV4;
  }) => PromiseLike<ImageModelV4CallOptions>;

  /**
   * 包装图像模型的生成操作。
   *
   * @param options - Object containing the generate function, parameters, and model.
   * @param options.doGenerate - The original generate function.
   * @param options.params - The parameters for the generate call. If the
   * 使用“transformParams”中间件，这将是转换后的参数。
   * @param options.model - The image model instance.
   * @returns A promise that resolves to the result of the generate operation.
   */
  wrapGenerate?: (options: {
    doGenerate: () => ReturnType<ImageModelV4['doGenerate']>;
    params: ImageModelV4CallOptions;
    model: ImageModelV4;
  }) => Promise<Awaited<ReturnType<ImageModelV4['doGenerate']>>>;
};
