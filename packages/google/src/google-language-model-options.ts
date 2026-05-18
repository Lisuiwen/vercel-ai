import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export type GoogleModelId =
  // 稳定的模型
  // https://ai.google.dev/gemini-api/docs/models/gemini
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-001'
  | 'gemini-2.0-flash-lite'
  | 'gemini-2.0-flash-lite-001'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-image'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash-preview-tts'
  | 'gemini-2.5-pro-preview-tts'
  | 'gemini-2.5-flash-native-audio-latest'
  | 'gemini-2.5-flash-native-audio-preview-09-2025'
  | 'gemini-2.5-flash-native-audio-preview-12-2025'
  | 'gemini-2.5-computer-use-preview-10-2025'
  | 'gemini-3-pro-preview'
  | 'gemini-3-pro-image-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-pro-preview-customtools'
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-3.1-flash-tts-preview'
  // 最新版本
  // https://ai.google.dev/gemini-api/docs/models#latest
  | 'gemini-pro-latest'
  | 'gemini-flash-latest'
  | 'gemini-flash-lite-latest'
  | 'deep-research-pro-preview-12-2025'
  | 'nano-banana-pro-preview'
  | 'aqa'
  // 实验模型
  // https://ai.google.dev/gemini-api/docs/models/experimental-models
  | 'gemini-robotics-er-1.5-preview'
  | 'gemma-3-1b-it'
  | 'gemma-3-4b-it'
  | 'gemma-3n-e4b-it'
  | 'gemma-3n-e2b-it'
  | 'gemma-3-12b-it'
  | 'gemma-3-27b-it'
  | (string & {});

export const googleLanguageModelOptions = lazySchema(() =>
  zodSchema(
    z.object({
      responseModalities: z.array(z.enum(['TEXT', 'IMAGE'])).optional(),

      thinkingConfig: z
        .object({
          thinkingBudget: z.number().optional(),
          includeThoughts: z.boolean().optional(),
          // https://ai.google.dev/gemini-api/docs/gemini-3?thinking=high#thinking_level
          thinkingLevel: z
            .enum(['minimal', 'low', 'medium', 'high'])
            .optional(),
        })
        .optional(),

      /**
       * 选修的。
       * 用作预测服务上下文的缓存内容的名称。
       * 格式：cachedContents/{cachedContent}
       */
      cachedContent: z.string().optional(),

      /**
       * 选修的。启用结构化输出。默认为 true。
       *
       * 当 JSON 模式包含以下元素时，这非常有用
       * OpenAPI 架构版本不支持
       * 谷歌使用。您可以使用它来禁用
       * 如果需要的话，结构化输出。
       */
      structuredOutputs: z.boolean().optional(),

      /**
       * 选修的。用于阻止不安全内容的独特安全设置列表。
       */
      safetySettings: z
        .array(
          z.object({
            category: z.enum([
              'HARM_CATEGORY_UNSPECIFIED',
              'HARM_CATEGORY_HATE_SPEECH',
              'HARM_CATEGORY_DANGEROUS_CONTENT',
              'HARM_CATEGORY_HARASSMENT',
              'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              'HARM_CATEGORY_CIVIC_INTEGRITY',
            ]),
            threshold: z.enum([
              'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
              'BLOCK_LOW_AND_ABOVE',
              'BLOCK_MEDIUM_AND_ABOVE',
              'BLOCK_ONLY_HIGH',
              'BLOCK_NONE',
              'OFF',
            ]),
          }),
        )
        .optional(),

      threshold: z
        .enum([
          'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
          'BLOCK_LOW_AND_ABOVE',
          'BLOCK_MEDIUM_AND_ABOVE',
          'BLOCK_ONLY_HIGH',
          'BLOCK_NONE',
          'OFF',
        ])
        .optional(),

      /**
       * 选修的。启用纯音频文件的时间戳理解。
       *
       * https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/audio-understanding
       */
      audioTimestamp: z.boolean().optional(),

      /**
       * 选修的。定义帐单报告中使用的标签。仅适用于 Vertex AI。
       *
       * https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/add-labels-to-api-calls
       */
      labels: z.record(z.string(), z.string()).optional(),

      /**
       * 选修的。如果指定，将使用指定的媒体分辨率。
       *
       * https://ai.google.dev/api/generate-content#MediaResolution
       */
      mediaResolution: z
        .enum([
          'MEDIA_RESOLUTION_UNSPECIFIED',
          'MEDIA_RESOLUTION_LOW',
          'MEDIA_RESOLUTION_MEDIUM',
          'MEDIA_RESOLUTION_HIGH',
        ])
        .optional(),

      /**
       * 选修的。配置 Gemini 模型的图像生成纵横比。
       *
       * https://ai.google.dev/gemini-api/docs/image- Generation#aspect_ratios
       */
      imageConfig: z
        .object({
          aspectRatio: z
            .enum([
              '1:1',
              '2:3',
              '3:2',
              '3:4',
              '4:3',
              '4:5',
              '5:4',
              '9:16',
              '16:9',
              '21:9',
              '1:8',
              '8:1',
              '1:4',
              '4:1',
            ])
            .optional(),
          imageSize: z.enum(['1K', '2K', '4K', '512']).optional(),
        })
        .optional(),

      /**
       * 选修的。接地恢复配置。
       * 用于为 Google 地图和 Google 搜索接地提供位置上下文。
       *
       * https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-maps
       */
      retrievalConfig: z
        .object({
          latLng: z
            .object({
              latitude: z.number(),
              longitude: z.number(),
            })
            .optional(),
        })
        .optional(),

      /**
       * 选修的。当设置为 true 时，函数调用参数将被流式传输
       * 通过流响应中的partialArgs 增量。仅支持
       * 在 Vertex AI API（不是 Gemini API）上且仅适用于 Gemini 3+
       * 模型。
       *
       * @default false
       *
       * https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling#streaming-fc
       */
      streamFunctionCallArguments: z.boolean().optional(),

      /**
       * 选修的。用于请求的服务层。
       */
      serviceTier: z.enum(['standard', 'flex', 'priority']).optional(),
    }),
  ),
);

export type GoogleLanguageModelOptions = InferSchema<
  typeof googleLanguageModelOptions
>;

// Vertex API 需要另一种服务层格式。
export const VertexServiceTierMap = {
  standard: 'SERVICE_TIER_STANDARD',
  flex: 'SERVICE_TIER_FLEX',
  priority: 'SERVICE_TIER_PRIORITY',
} as const;
