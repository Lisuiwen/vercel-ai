import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export type OpenAIImageModelId =
  | 'dall-e-3'
  | 'dall-e-2'
  | 'gpt-image-1'
  | 'gpt-image-1-mini'
  | 'gpt-image-1.5'
  | 'gpt-image-2'
  | 'chatgpt-image-latest'
  | (string & {});

// https://platform.openai.com/docs/guides/images
export const modelMaxImagesPerCall: Record<OpenAIImageModelId, number> = {
  'dall-e-3': 1,
  'dall-e-2': 10,
  'gpt-image-1': 10,
  'gpt-image-1-mini': 10,
  'gpt-image-1.5': 10,
  'gpt-image-2': 10,
  'chatgpt-image-latest': 10,
};

const defaultResponseFormatPrefixes = [
  'chatgpt-image-',
  'gpt-image-1-mini',
  'gpt-image-1.5',
  'gpt-image-1',
  'gpt-image-2',
];

export function hasDefaultResponseFormat(modelId: string): boolean {
  return defaultResponseFormatPrefixes.some(prefix =>
    modelId.startsWith(prefix),
  );
}

const baseImageModelOptionsObject = z.object({
  /**
   * 生成图像的质量。
   *
   * 有效值：“标准”、“高清”、“低”、“中”、“高”、“自动”。
   */
  quality: z
    .enum(['standard', 'hd', 'low', 'medium', 'high', 'auto'])
    .optional(),

  /**
   * 生成的图像的后台行为。
   *
   * 如果是“透明”，则输出格式必须支持透明度
   * （即“png”或“webp”）。
   */
  background: z.enum(['transparent', 'opaque', 'auto']).optional(),

  /**
   * 返回生成的图像的格式。
   */
  outputFormat: z.enum(['png', 'jpeg', 'webp']).optional(),

  /**
   * 生成图像的压缩级别 (0-100)。适用于
   * `jpeg` 和 `webp` 输出格式。
   */
  outputCompression: z.number().int().min(0).max(100).optional(),

  /**
   * 代表您的最终用户的唯一标识符，可以帮助 OpenAI
   * 监控和发现滥用行为。
   */
  user: z.string().optional(),
});

export const openaiImageModelOptions = lazySchema(() =>
  zodSchema(baseImageModelOptionsObject),
);

export type OpenAIImageModelOptions = InferSchema<
  typeof openaiImageModelOptions
>;

export const openaiImageModelGenerationOptions = lazySchema(() =>
  zodSchema(
    baseImageModelOptionsObject.extend({
      /**
       * 生成图像的样式。 “生动”产生超真实和
       * 戏剧性的图像； “自然”产生更柔和、更少超真实的效果
       * 寻找图像。
       */
      style: z.enum(['vivid', 'natural']).optional(),

      /**
       * 生成的图像的内容审核级别。 “低”适用
       * 限制性过滤较少。
       */
      moderation: z.enum(['auto', 'low']).optional(),
    }),
  ),
);

export type OpenAIImageModelGenerationOptions = InferSchema<
  typeof openaiImageModelGenerationOptions
>;

export const openaiImageModelEditOptions = lazySchema(() =>
  zodSchema(
    baseImageModelOptionsObject.extend({
      /**
       * 输出图像与输入图像的保真度。
       */
      inputFidelity: z.enum(['high', 'low']).optional(),
    }),
  ),
);

export type OpenAIImageModelEditOptions = InferSchema<
  typeof openaiImageModelEditOptions
>;
