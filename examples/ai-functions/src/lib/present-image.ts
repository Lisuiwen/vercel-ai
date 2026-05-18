import type { Experimental_GeneratedImage as GeneratedImage } from 'ai';
import fs from 'node:fs';
import imageType from 'image-type';
import path from 'node:path';
import sharp from 'sharp';
import terminalImage from 'terminal-image';

const OUTPUT_DIR = 'output';

/**
 * 使用下采样预览在终端中显示图像并保存
 * 原始的全分辨率文件到具有唯一的输出目录
 * 时间戳。
 * @param images - An array of generated images to process and display.
 */
export async function presentImages(images: GeneratedImage[]) {
  const timestamp = Date.now();
  for (const [index, image] of images.entries()) {
    let srcBuffer = image.uint8Array;

    // 确定图像的格式。
    const format = await imageType(srcBuffer);
    const extension = format?.ext;
    if (!extension) {
      throw new Error('Unknown image format');
    }

    if (extension === 'webp') {
      // `terminal-image` doesn't support WebP, so convert to PNG.
      srcBuffer = await sharp(srcBuffer).png().toBuffer();
    }

    // 将图像渲染到终端。
    console.log(await terminalImage.buffer(Buffer.from(srcBuffer)));

    // 将原始图像保存到文件中。
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const filePath = path.join(
      OUTPUT_DIR,
      `image-${timestamp}-${index}.${extension}`,
    );
    await fs.promises.writeFile(filePath, srcBuffer);
    console.log(`Saved image to ${filePath}`);
  }

  console.log(`Processed ${images.length} images`);
}
