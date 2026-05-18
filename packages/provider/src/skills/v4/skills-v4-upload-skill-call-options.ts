import type {
  SharedV4FileDataData,
  SharedV4FileDataText,
} from '../../shared/v4/shared-v4-file-data';
import type { SharedV4ProviderOptions } from '../../shared/v4/shared-v4-provider-options';

export interface SkillsV4File {
  /**
   * 文件相对于技能根的路径。
   */
  path: string;

  /**
   * 文件数据。
   *
   * - `{ type: 'data', data }`：原始字节 (`Uint8Array`) 或 Base64 编码的字符串。
   * - `{ type: 'text', text }`：内联文本 (UTF-8)。
   */
  data: SharedV4FileDataData | SharedV4FileDataText;
}

export interface SkillsV4UploadSkillCallOptions {
  /**
   * 构成技能的文件。
   */
  files: SkillsV4File[];

  /**
   * 该技能的可选人类可读标题。
   */
  displayTitle?: string;

  /**
   * 其他特定于提供商的选项。
   */
  providerOptions?: SharedV4ProviderOptions;
}
