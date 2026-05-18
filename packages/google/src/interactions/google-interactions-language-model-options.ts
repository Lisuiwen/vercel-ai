import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/**
 * 交互 API 接受的 Gemini 模型 ID 的仅类型联合
 * `模型：`。镜像来自“googleapis/js-genai”的“模型”
 * `src/interactions/resources/interactions.ts`。
 *
 * 即使大多数 ID 重叠，仍保留为与“GoogleModelId”不同的类型；
 * 两个表面（`:generateContent` vs `/interactions`）是独立的并且
 * 随着时间的推移可能会有所不同。
 */
export type GoogleInteractionsModelId =
  | 'gemini-2.5-computer-use-preview-10-2025'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-image'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash-lite-preview-09-2025'
  | 'gemini-2.5-flash-native-audio-preview-12-2025'
  | 'gemini-2.5-flash-preview-09-2025'
  | 'gemini-2.5-flash-preview-tts'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-pro-preview-tts'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-image-preview'
  | 'gemini-3-pro-preview'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-3.1-flash-lite-preview'
  | 'gemini-3.1-flash-tts-preview'
  | 'lyria-3-clip-preview'
  | 'lyria-3-pro-preview'
  | (string & {});

/**
 * 用于“google.interactions(...)”调用的提供程序选项架构。读自
 * 共享 `providerOptions.google.*` 命名空间（每个 PRD）；每次调用选项
 * AI SDK 本身并不在这里公开。
 *
 * 根据现有的 Google 提供商约定，所有字段均为“.nullish()”。
 */
export const googleInteractionsLanguageModelOptions = lazySchema(() =>
  zodSchema(
    z.object({
      previousInteractionId: z.string().nullish(),
      store: z.boolean().nullish(),

      agent: z.string().nullish(),
      agentConfig: z
        .union([
          z
            .object({
              type: z.literal('dynamic'),
            })
            .loose(),
          z.object({
            type: z.literal('deep-research'),
            thinkingSummaries: z.enum(['auto', 'none']).nullish(),
            visualization: z.enum(['off', 'auto']).nullish(),
            collaborativePlanning: z.boolean().nullish(),
          }),
        ])
        .nullish(),

      thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high']).nullish(),
      thinkingSummaries: z.enum(['auto', 'none']).nullish(),

      /**
       * 直接映射到 API 的“response_format”的输出格式条目
       * 数组。使用它来请求图像、音频或非 JSON 文本输出
       * 完全控制“mime_type”、“aspect_ratio”和“image_size”。
       *
       * 参赛作品按顺序发送。 AI SDK 调用级别 `responseFormat: {
       * type: 'json', schema }` 仍然驱动 JSON 模式并添加匹配
       * 自动输入文字；此处列出的条目是附加的。
       */
      responseFormat: z
        .array(
          z.union([
            z
              .object({
                type: z.literal('text'),
                mimeType: z.string().nullish(),
                schema: z.unknown().nullish(),
              })
              .loose(),
            z
              .object({
                type: z.literal('image'),
                mimeType: z.string().nullish(),
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
                  .nullish(),
                imageSize: z.enum(['1K', '2K', '4K', '512']).nullish(),
              })
              .loose(),
            z
              .object({
                type: z.literal('audio'),
                mimeType: z.string().nullish(),
              })
              .loose(),
          ]),
        )
        .nullish(),

      /**
       * @deprecated 将 `responseFormat` 与 `{ type: 'image', ... }` 一起使用
       * 代替条目。保留是为了向后兼容；软件开发工具包
       * 将其转换为匹配的“response_format”图像条目并
       * 设置后发出警告。
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
            .nullish(),
          imageSize: z.enum(['1K', '2K', '4K', '512']).nullish(),
        })
        .nullish(),
      mediaResolution: z
        .enum(['low', 'medium', 'high', 'ultra_high'])
        .nullish(),

      responseModalities: z
        .array(z.enum(['text', 'image', 'audio', 'video', 'document']))
        .nullish(),
      serviceTier: z.enum(['flex', 'standard', 'priority']).nullish(),

      /**
       * AI SDK“系统”消息的替代方案。如果两者都设置了，则AI SDK
       * `system` 消息获胜并发出警告。
       */
      systemInstruction: z.string().nullish(),

      /**
       * 用于往返“thought.signature”的每块签名和
       * `function_call.signature` 块。由SDK对输出推理设置/
       * 工具调用部分；输入部分不变地传回，因此 API
       * 接受先前的回合。
       */
      signature: z.string().nullish(),

      /**
       * 由 SDK 在输出助手消息上设置。转换器使用它来
       * 决定在压缩时丢弃哪些消息
       * `previousInteractionId`。
       */
      interactionId: z.string().nullish(),

      /**
       * 轮询后台交互（代理
       * 打电话）在放弃之前。默认为 30 分钟。长期代理
       * 例如深度研究可能需要数十分钟——如果需要的话可以增加时间。
       */
      pollingTimeoutMs: z.number().int().positive().nullish(),
    }),
  ),
);

export type GoogleLanguageModelInteractionsOptions = InferSchema<
  typeof googleInteractionsLanguageModelOptions
>;
