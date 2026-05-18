import type { GeneratedFile } from 'ai';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = 'output';

/**
 * 将生成的视频文件保存到具有唯一时间戳的输出目录。
 * 视频通常太大而无法在终端中显示，因此我们只需保存它们。
 * @param videos - An array of generated videos to process and save.
 */
export async function presentVideos(videos: GeneratedFile[]) {
  const timestamp = Date.now();
  for (const [index, video] of videos.entries()) {
    const mediaType = video.mediaType || 'video/mp4';
    const extension = mediaType.split('/')[1] || 'mp4';

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const filePath = path.join(
      OUTPUT_DIR,
      `video-${timestamp}-${index}.${extension}`,
    );

    const videoData = video.uint8Array;
    await fs.promises.writeFile(filePath, videoData);
    console.log(`Saved video to ${filePath}`);
    console.log(`  Media type: ${mediaType}`);
    console.log(`  Size: ${(videoData.length / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log(`\nProcessed ${videos.length} video(s)`);
}
