import type { SharedV3ProviderOptions } from '../../shared';
import type { ImageModelV3File } from './image-model-v3-file';

export type ImageModelV3CallOptions = {
  /**
   * 提示图像生成。某些操作（例如升级）可能不需要提示。
   */
  prompt: string | undefined;

  /**
   * 要生成的图像数量。
   */
  n: number;

  /**
   * 要生成的图像的大小。
   * 格式必须为“{宽度}x{高度}”。
   * `undefined` 将使用提供者的默认大小。
   */
  size: `${number}x${number}` | undefined;

  /**
   * 要生成的图像的长宽比。
   * 必须采用“{width}:{height}”格式。
   * `undefined` 将使用提供者的默认宽高比。
   */
  aspectRatio: `${number}:${number}` | undefined;

  /**
   * 图像生成的种子。
   * `undefined` 将使用提供者的默认种子。
   */
  seed: number | undefined;

  /**
   * 用于图像编辑或变体生成的图像数组。
   * 图像应以 base64 编码字符串或二进制数据的形式提供。
   */
  files: ImageModelV3File[] | undefined;

  /**
   * 用于修复操作的蒙版图像。
   * 掩码应以 base64 编码字符串或二进制数据形式提供。
   */
  mask: ImageModelV3File | undefined;

  /**
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   *
   * 外部记录以提供者名称为键，内部记录以提供者名称为键
   * 记录由特定于提供者的元数据密钥作为密钥。
   *
   * ````ts
   * {
   *   “开放”：{
   *     “风格”：“生动”
   *   }
   * }
   * ```
   */
  providerOptions: SharedV3ProviderOptions;

  /**
   * 用于取消操作的中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 与请求一起发送的附加 HTTP 标头。
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: Record<string, string | undefined>;
};
