import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export type OpenAITranscriptionModelId =
  | 'whisper-1'
  | 'gpt-4o-mini-transcribe'
  | 'gpt-4o-mini-transcribe-2025-03-20'
  | 'gpt-4o-mini-transcribe-2025-12-15'
  | 'gpt-4o-transcribe'
  | 'gpt-4o-transcribe-diarize'
  | (string & {});

// https://platform.openai.com/docs/api-reference/audio/createTranscription
export const openAITranscriptionModelOptions = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 要包含在转录响应中的其他信息。
       */

      include: z.array(z.string()).optional(),

      /**
       * ISO-639-1 格式的输入音频的语言。
       */
      language: z.string().optional(),

      /**
       * 用于指导模型风格或继续之前的音频片段的可选文本。
       */
      prompt: z.string().optional(),

      /**
       * 采样温度，介于 0 和 1 之间。
       * @default 0
       */
      temperature: z.number().min(0).max(1).default(0).optional(),

      /**
       * 为此转录填充的时间戳粒度。
       * @default ['segment']
       */
      timestampGranularities: z
        .array(z.enum(['word', 'segment']))
        .default(['segment'])
        .optional(),
    }),
  ),
);

export type OpenAITranscriptionModelOptions = InferSchema<
  typeof openAITranscriptionModelOptions
>;
