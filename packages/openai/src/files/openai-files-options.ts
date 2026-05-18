import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const openaiFilesOptionsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      /*
       * OpenAI API 必需，但此处可选，因为
       * SDK 默认为“助手”——迄今为止最常见的
       * 在此上下文中上传文件时的目的。
       */
      purpose: z.string().optional(),
      expiresAfter: z.number().optional(),
    }),
  ),
);

export type OpenAIFilesOptions = InferSchema<typeof openaiFilesOptionsSchema>;
