import type { GeneratedFile } from '../generate-text';
import type { VideoModelProviderMetadata } from '../types/video-model';
import type { VideoModelResponseMetadata } from '../types/video-model-response-metadata';
import type { Warning } from '../types/warning';

/**
 * `experimental_generateVideo` 调用的结果。
 * 包含生成的视频和附加信息。
 */
export interface GenerateVideoResult {
  /**
   * 生成的第一个视频。
   */
  readonly video: GeneratedFile;

  /**
   * 生成的所有视频。
   */
  readonly videos: Array<GeneratedFile>;

  /**
   * 通话警告，例如不支持的设置。
   */
  readonly warnings: Array<Warning>;

  /**
   * 来自提供商的响应元数据。
   * 如果进行多次调用，可能包含多个响应。
   */
  readonly responses: Array<VideoModelResponseMetadata>;

  /**
   * 从提供者传递的特定于提供者的元数据。
   */
  readonly providerMetadata: VideoModelProviderMetadata;
}
