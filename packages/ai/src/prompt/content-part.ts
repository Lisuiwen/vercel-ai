import {
  isBuffer,
  type CustomPart,
  type DataContent,
  type FilePart,
  type ImagePart,
  type ProviderOptions,
  type ReasoningFilePart,
  type ReasoningPart,
  type TextPart,
  type ToolApprovalRequest,
  type ToolApprovalResponse,
  type ToolResultOutput,
  type ToolResultPart,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';
import { jsonValueSchema } from '../types/json-value';
import { providerMetadataSchema } from '../types/provider-metadata';

const fileInlineDataSchema: z.ZodType<DataContent> = z.union([
  z.string(),
  z.instanceof(Uint8Array),
  z.instanceof(ArrayBuffer),
  z.custom<Buffer>(isBuffer, { message: 'Must be a Buffer' }),
]);

const providerReferenceSchema = z.record(z.string(), z.string());

/**
 * @内部的
 */
export const textPartSchema: z.ZodType<TextPart> = z.object({
  type: z.literal('text'),
  text: z.string(),
  providerOptions: providerMetadataSchema.optional(),
});

/**
 * @内部的
 * @deprecated 将 `filePartSchema` 与 `mediaType: 'image'` 一起使用：
 * `{ 类型：'文件'，媒体类型：'图像'，数据：{ 类型：'数据'，数据 } }`。
 */
export const imagePartSchema: z.ZodType<ImagePart> = z.object({
  type: z.literal('image'),
  image: z.union([
    fileInlineDataSchema,
    z.instanceof(URL),
    providerReferenceSchema,
  ]),
  mediaType: z.string().optional(),
  providerOptions: providerMetadataSchema.optional(),
});

const taggedFileDataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('data'), data: fileInlineDataSchema }),
  z.object({ type: z.literal('url'), url: z.instanceof(URL) }),
  z.object({
    type: z.literal('reference'),
    reference: providerReferenceSchema,
  }),
  z.object({ type: z.literal('text'), text: z.string() }),
]);

const taggedReasoningFileDataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('data'), data: fileInlineDataSchema }),
  z.object({ type: z.literal('url'), url: z.instanceof(URL) }),
]);

/**
 * @内部的
 */
export const filePartSchema: z.ZodType<FilePart> = z.object({
  type: z.literal('file'),
  data: z.union([
    taggedFileDataSchema,
    fileInlineDataSchema,
    z.instanceof(URL),
    providerReferenceSchema,
  ]),
  filename: z.string().optional(),
  mediaType: z.string(),
  providerOptions: providerMetadataSchema.optional(),
});

/**
 * @内部的
 */
export const reasoningPartSchema: z.ZodType<ReasoningPart> = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  providerOptions: providerMetadataSchema.optional(),
});

/**
 * @内部的
 */
export const customPartSchema: z.ZodType<CustomPart> = z.object({
  type: z.literal('custom'),
  kind: z.string().transform(value => value as `${string}.${string}`),
  providerOptions: providerMetadataSchema.optional(),
});

/**
 * @内部的
 */
export const reasoningFilePartSchema: z.ZodType<ReasoningFilePart> = z.object({
  type: z.literal('reasoning-file'),
  data: z.union([
    taggedReasoningFileDataSchema,
    fileInlineDataSchema,
    z.instanceof(URL),
  ]),
  mediaType: z.string(),
  providerOptions: providerMetadataSchema.optional(),
});

/**
 * 工具调用提示内容的一部分。它包含一个工具调用（通常由AI模型生成）。
 */
export interface ToolCallPart {
  type: 'tool-call';

  /**
   * 工具调用的 ID。该 ID 用于将工具调用与工具结果进行匹配。
   */
  toolCallId: string;

  /**
   * 正在调用的工具的名称。
   */
  toolName: string;

  /**
   * 工具调用的参数。这是一个与工具的输入架构匹配的 JSON 可序列化对象。
   */
  input: unknown;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从AI SDK发送给成功并实现特定的成功
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * @内部的
 */
export const toolCallPartSchema: z.ZodType<ToolCallPart> = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  providerOptions: providerMetadataSchema.optional(),
  providerExecuted: z.boolean().optional(),
}) as z.ZodType<ToolCallPart>; // 必要的 bc 输入在 Zod 类型上是可选的

/**
 * @内部的
 */
export const outputSchema: z.ZodType<ToolResultOutput> = z.discriminatedUnion(
  'type',
  [
    z.object({
      type: z.literal('text'),
      value: z.string(),
      providerOptions: providerMetadataSchema.optional(),
    }),
    z.object({
      type: z.literal('json'),
      value: jsonValueSchema,
      providerOptions: providerMetadataSchema.optional(),
    }),
    z.object({
      type: z.literal('execution-denied'),
      reason: z.string().optional(),
      providerOptions: providerMetadataSchema.optional(),
    }),
    z.object({
      type: z.literal('error-text'),
      value: z.string(),
      providerOptions: providerMetadataSchema.optional(),
    }),
    z.object({
      type: z.literal('error-json'),
      value: jsonValueSchema,
      providerOptions: providerMetadataSchema.optional(),
    }),
    z.object({
      type: z.literal('content'),
      value: z.array(
        z.union([
          z.object({
            type: z.literal('text'),
            text: z.string(),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            type: z.literal('file'),
            data: taggedFileDataSchema,
            mediaType: z.string(),
            filename: z.string().optional(),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('file-data'),
            data: z.string(),
            mediaType: z.string(),
            filename: z.string().optional(),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('file-url'),
            url: z.string(),
            mediaType: z.string().optional(),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('file-id'),
            fileId: z.union([z.string(), z.record(z.string(), z.string())]),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('file-reference'),
            providerReference: z.record(z.string(), z.string()),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('image-data'),
            data: z.string(),
            mediaType: z.string(),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('image-url'),
            url: z.string(),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('image-file-id'),
            fileId: z.union([z.string(), z.record(z.string(), z.string())]),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            // 已弃用。
            type: z.literal('image-file-reference'),
            providerReference: z.record(z.string(), z.string()),
            providerOptions: providerMetadataSchema.optional(),
          }),
          z.object({
            type: z.literal('custom'),
            providerOptions: providerMetadataSchema.optional(),
          }),
        ]),
      ),
    }),
  ],
);

/**
 * @内部的
 */
export const toolResultPartSchema: z.ZodType<ToolResultPart> = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  output: outputSchema,
  providerOptions: providerMetadataSchema.optional(),
}) as z.ZodType<ToolResultPart>; // 必要的 bc 结果在 Zod 类型上是可选的

/**
 * @内部的
 */
export const toolApprovalRequestSchema: z.ZodType<ToolApprovalRequest> =
  z.object({
    type: z.literal('tool-approval-request'),
    approvalId: z.string(),
    toolCallId: z.string(),
  });

/**
 * @内部的
 */
export const toolApprovalResponseSchema: z.ZodType<ToolApprovalResponse> =
  z.object({
    type: z.literal('tool-approval-response'),
    approvalId: z.string(),
    approved: z.boolean(),
    reason: z.string().optional(),
  });
