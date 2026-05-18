import type { SharedV2ProviderOptions } from '../../shared';

export type ImageModelV2CallOptions = {
  /**
   * 提示图像生成。
   */
  prompt: string;

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
   * 传递给提供商的其他特定于提供商的选项
   * 作为身体参数。
   *
   * 外部记录以提供者名称为键，内部记录以提供者名称为键
   * 记录由特定于提供者的元数据密钥作为密钥。
   * ````ts
   * {
   * “开放”：{
   * “风格”：“生动”
   * }
   * }
   * ```
   */
  providerOptions: SharedV2ProviderOptions;

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
