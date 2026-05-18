import type { JSONArray, JSONValue } from '../../json-value';
import type { SharedV4Warning } from '../../shared/v4/shared-v4-warning';
import type { ImageModelV4Usage } from './image-model-v4-usage';

export type ImageModelV4ProviderMetadata = Record<
  string,
  {
    images: JSONArray;
  } & JSONValue
>;

/**
 * 图像模型 doGenerate 调用的结果。
 */
export type ImageModelV4Result = {
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
  warnings: Array<SharedV4Warning>;

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
  providerMetadata?: ImageModelV4ProviderMetadata;

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
  usage?: ImageModelV4Usage;
};
