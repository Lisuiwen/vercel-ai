import {
  DefaultGeneratedFile,
  type GeneratedFile,
} from '../generate-text/generated-file';
/**
 * 生成的音频文件。
 */
export interface GeneratedAudioFile extends GeneratedFile {
  /**
   * 文件的音频格式（如`mp3`、`wav`等）
   */
  readonly format: string;
}

export class DefaultGeneratedAudioFile
  extends DefaultGeneratedFile
  implements GeneratedAudioFile
{
  readonly format: string;

  constructor({
    data,
    mediaType,
  }: {
    data: string | Uint8Array;
    mediaType: string;
  }) {
    super({ data, mediaType });
    let format = 'mp3';

    // 如果未提供格式，请尝试根据媒体类型确定格式
    if (mediaType) {
      const mediaTypeParts = mediaType.split('/');

      if (mediaTypeParts.length === 2) {
        // 处理音频格式的特殊情况
        if (mediaType !== 'audio/mpeg') {
          format = mediaTypeParts[1];
        }
      }
    }

    if (!format) {
      // TODO 这应该是 AI SDK 错误
      throw new Error(
        'Audio format must be provided or determinable from media type',
      );
    }

    this.format = format;
  }
}

export class DefaultGeneratedAudioFileWithType extends DefaultGeneratedAudioFile {
  readonly type = 'audio';

  constructor(options: {
    data: string | Uint8Array;
    mediaType: string;
    format: string;
  }) {
    super(options);
  }
}
