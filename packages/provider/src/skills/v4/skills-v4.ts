import type { SkillsV4UploadSkillCallOptions } from './skills-v4-upload-skill-call-options';
import type { SkillsV4UploadSkillResult } from './skills-v4-upload-skill-result';

/**
 * 技能规范第 4 版。
 */
export interface SkillsV4 {
  /**
   * 技能实现必须指定哪个技能接口
   * 它实现的版本。这将使我们能够发展技能
   * 接口并保留向后兼容性。不同的
   * 实现版本可以作为有区别的联合来处理
   * 在我们这边。
   */
  readonly specificationVersion: 'v4';

  /**
   * 用于记录目的的提供商名称。
   */
  readonly provider: string;

  /**
   * 从给定文件上传新技能。
   */
  uploadSkill(
    params: SkillsV4UploadSkillCallOptions,
  ): PromiseLike<SkillsV4UploadSkillResult>;
}
