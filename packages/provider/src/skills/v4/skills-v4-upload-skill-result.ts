import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';
import type { SharedV4ProviderReference } from '../../shared/v4/shared-v4-provider-reference';
import type { SharedV4Warning } from '../../shared/v4/shared-v4-warning';

export interface SkillsV4UploadSkillResult {
  /**
   * 提供者参考将提供者名称映射到提供者特定的技能标识符。
   */
  providerReference: SharedV4ProviderReference;

  /**
   * 上传技能的可选人类可读标题。
   */
  displayTitle?: string;

  /**
   * 上传技能的可选名称。
   */
  name?: string;

  /**
   * 上传技能用途的可选描述。
   */
  description?: string;

  /**
   * 上传技能的可选最新版本标识符。
   */
  latestVersion?: string;

  /**
   * 其他特定于提供商的元数据。
   */
  providerMetadata?: SharedV4ProviderMetadata;

  /**
   * 通话警告，例如不支持的设置。
   */
  warnings: SharedV4Warning[];
}
