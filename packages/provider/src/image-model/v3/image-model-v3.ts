import type { JSONArray, JSONValue } from '../../json-value';
import type { ImageModelV3Usage } from './image-model-v3-usage';
import type { ImageModelV3CallOptions } from './image-model-v3-call-options';
import type { SharedV3Warning } from '../../shared/v3/shared-v3-warning';

export type ImageModelV3ProviderMetadata = Record<
  string,
  {
    images: JSONArray;
  } & JSONValue
>;

type GetMaxImagesPerCallFunction = (options: {
  modelId: string;
}) => PromiseLike<number | undefined> | number | undefined;

/**
 * 图像生成模型规范第 3 版。
 */
export type ImageModelV3 = {
  /**
   * 图像模型必须指定哪个图像模型接口
   * 它实现的版本。这将使我们能够发展图像
   * 模型接口并保留向后兼容性。不同的
   * 实现版本可以作为有区别的联合来处理
   * 在我们这边。
   */
  readonly specificationVersion: 'v3';

  /**
   * 用于记录目的的提供商名称。
   */
  readonly provider: string;

  /**
   * Provider-specific model ID for logging purposes.
   */
  readonly modelId: string;

  /**
   * 一次 API 调用中可以生成多少图像的限制。
   * 可以设置为一个数字进行固定限制，以undefined来使用
   * 全局限制，或返回数字或未定义的函数，
   * 可选地作为承诺。
   */
  readonly maxImagesPerCall: number | undefined | GetMaxImagesPerCallFunction;

  /**
   * 生成图像数组。
   */
  doGenerate(options: ImageModelV3CallOptions): PromiseLike<{
    /**
     * 生成的图像为 base64 编码字符串或二进制数据。
     * 返回的图像应不进行任何不必要的转换。
     * 如果API返回base64编码的字符串，则应返回图像
     * 作为 base64 编码的字符串。如果 API 返回二进制数据，则图像应该
     * 以二进制数据形式返回。
     */
    images: Array<string> | Array<Uint8Array>;

    /**
     * 通话警告，例如不支持的功能。
     */
    warnings: Array<SharedV3Warning>;

    /**
     * 其他特定于提供商的元数据。他们通过
     * 从提供商到 AI SDK 并启用提供商特定的
     * 可以完全封装在提供者中的结果。
     *
     * 外部记录以提供者名称为键，内部记录以提供者名称为键
     * 记录是特定于提供者的元数据。它总是包括一个
     * 带有图像特定元数据的“images”键
     *
     * ````ts
     * {
     * “开放”：{
     * "images": ["revisedPrompt": "此处修改了提示。"]
     * }
     * }
     * ```
     */
    providerMetadata?: ImageModelV3ProviderMetadata;

    /**
     * 用于遥测和调试目的的响应信息。
     */
    response: {
      /**
       * 生成的响应的开始时间戳。
       */
      timestamp: Date;

      /**
       * 用于生成响应的响应模型的 ID。
       */
      modelId: string;

      /**
       * 响应标头。
       */
      headers: Record<string, string> | undefined;
    };

    /**
     * 用于图像生成调用的可选令牌使用（如果提供商报告）。
     */
    usage?: ImageModelV3Usage;
  }>;
};
