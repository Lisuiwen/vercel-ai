import { z } from 'zod/v4';
import { createJsonErrorResponseHandler } from '@ai-sdk/provider-utils';

export const openaiErrorDataSchema = z.object({
  error: z.object({
    message: z.string(),

    // 下面的附加信息被宽松地处理以支持
    // 错误略有不同的 OpenAI 兼容提供商
    // 回应：
    type: z.string().nullish(),
    param: z.any().nullish(),
    code: z.union([z.string(), z.number()]).nullish(),
  }),
});

export type OpenAIErrorData = z.infer<typeof openaiErrorDataSchema>;

export const openaiFailedResponseHandler = createJsonErrorResponseHandler({
  errorSchema: openaiErrorDataSchema,
  errorToMessage: data => data.error.message,
});
