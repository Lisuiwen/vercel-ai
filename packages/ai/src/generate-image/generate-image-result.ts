import type { GeneratedFile } from '../generate-text';
import type { ImageModelProviderMetadata } from '../types/image-model';
import type { ImageModelResponseMetadata } from '../types/image-model-response-metadata';
import type { ImageModelUsage } from '../types/usage';
import type { Warning } from '../types/warning';

/**
 * `generateImage` 调用的结果。
 * 它包含图像和附加信息。
 */
export interface GenerateImageResult {
  /**
   * 生成的第一张图像。
   */
  readonly image: GeneratedFile;

  /**
   * 生成的图像。
   */
  readonly images: Array<GeneratedFile>;

  /**
   * 通话警告，例如不支持的设置。
   */
  readonly warnings: Array<Warning>;

  /**
   * 来自提供商的响应元数据。如果我们多次调用模型，可能会有多个响应。
   */
  readonly responses: Array<ImageModelResponseMetadata>;

  /**
   * 实现特定的元数据。它们从交付到AI SDK，并实现特定的元数据
   * 可以完全封装在提供者中的结果。
   */
  readonly providerMetadata: ImageModelProviderMetadata;

  /**
   * 所有底层提供商调用此图像生成的组合令牌使用情况。
   */
  readonly usage: ImageModelUsage;
}
