import type { GeneratedAudioFile } from 'ai';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = 'output';
const audioFormatMap = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
};

/**
 * 将生成的音频文件保存到具有唯一时间戳的输出目录。
 * @param audio - The generated audio file to save.
 */
export async function saveAudioFile(audio: GeneratedAudioFile) {
  const timestamp = Date.now();
  const extension =
    audio.mediaType in audioFormatMap
      ? audioFormatMap[audio.mediaType as keyof typeof audioFormatMap]
      : 'mp3';

  // 将音频文件保存到磁盘。
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = path.join(OUTPUT_DIR, `audio-${timestamp}.${extension}`);
  await fs.promises.writeFile(filePath, audio.uint8Array);
  console.log(`Saved audio to ${filePath}`);
}
