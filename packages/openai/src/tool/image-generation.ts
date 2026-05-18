import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const imageGenerationArgsSchema = lazySchema(() =>
  zodSchema(
    z
      .object({
        background: z.enum(['auto', 'opaque', 'transparent']).optional(),
        inputFidelity: z.enum(['low', 'high']).optional(),
        inputImageMask: z
          .object({
            fileId: z.string().optional(),
            imageUrl: z.string().optional(),
          })
          .optional(),
        model: z.string().optional(),
        moderation: z.enum(['auto']).optional(),
        outputCompression: z.number().int().min(0).max(100).optional(),
        outputFormat: z.enum(['png', 'jpeg', 'webp']).optional(),
        partialImages: z.number().int().min(0).max(3).optional(),
        quality: z.enum(['auto', 'low', 'medium', 'high']).optional(),
        size: z
          .enum(['1024x1024', '1024x1536', '1536x1024', 'auto'])
          .optional(),
      })
      .strict(),
  ),
);

const imageGenerationInputSchema = lazySchema(() => zodSchema(z.object({})));

export const imageGenerationOutputSchema = lazySchema(() =>
  zodSchema(z.object({ result: z.string() })),
);

type ImageGenerationArgs = {
  /**
   * 生成图像的背景类型。默认为“自动”。
   */
  background?: 'auto' | 'opaque' | 'transparent';

  /**
   * 生成图像的输入保真度。默认值为“低”。
   */
  inputFidelity?: 'low' | 'high';

  /**
   * 可选的修复面罩。
   * 包含 image_url（字符串，可选）和 file_id（字符串，可选）。
   */
  inputImageMask?: {
    /**
     * 遮罩图像的文件 ID。
     */
    fileId?: string;

    /**
     * Base64 编码的蒙版图像。
     */
    imageUrl?: string;
  };

  /**
   * 要使用的图像生成模型。默认值：gpt-image-1。
   */
  model?: string;

  /**
   * 生成图像的审核级别。默认值：自动。
   */
  moderation?: 'auto';

  /**
   * 输出图像的压缩级别。默认值：100。
   */
  outputCompression?: number;

  /**
   * 生成图像的输出格式。 png、webp 或 jpeg 之一。
   * 默认值：png
   */
  outputFormat?: 'png' | 'jpeg' | 'webp';

  /**
   * 流模式下生成的部分图像的数量，从 0（默认值）到 3。
   */
  partialImages?: number;

  /**
   * 生成图像的质量。
   * 低、中、高或自动之一。默认值：自动。
   */
  quality?: 'auto' | 'low' | 'medium' | 'high';

  /**
   * 生成图像的大小。
   * 1024x1024、1024x1536、1536x1024 或自动之一。
   * 默认值：自动。
   */
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
};

const imageGenerationToolFactory = createProviderExecutedToolFactory<
  {},
  {
    /**
     * 生成的图像以 base64 编码。
     */
    result: string;
  },
  ImageGenerationArgs
>({
  id: 'openai.image_generation',
  inputSchema: imageGenerationInputSchema,
  outputSchema: imageGenerationOutputSchema,
});

export const imageGeneration = (
  args: ImageGenerationArgs = {}, // 默认
) => {
  return imageGenerationToolFactory(args);
};
