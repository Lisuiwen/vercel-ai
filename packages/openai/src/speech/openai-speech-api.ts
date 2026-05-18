export type OpenAISpeechAPITypes = {
  /**
   * 生成音频时使用的语音。
   * 支持的声音有合金、灰烬、民谣、珊瑚、回声、寓言、缟玛瑙、新星、鼠尾草、微光和诗句。
   * @default 'alloy'
   */
  voice?:
    | 'alloy'
    | 'ash'
    | 'ballad'
    | 'coral'
    | 'echo'
    | 'fable'
    | 'onyx'
    | 'nova'
    | 'sage'
    | 'shimmer'
    | 'verse';

  /**
   * 生成音频的速度。
   * 选择 0.25 到 4.0 之间的值。
   * @default 1.0
   */
  speed?: number;

  /**
   * 生成的音频的格式。
   * @default 'mp3'
   */
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

  /**
   * 语音生成的说明，例如“用缓慢而稳定的语气说话”。
   * 不适用于 tts-1 或 tts-1-hd。
   */
  instructions?: string;
};
