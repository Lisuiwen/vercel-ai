import {
  lazySchema,
  zodSchema,
  type InferSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export type GoogleEmbeddingModelId =
  | 'gemini-embedding-001'
  | 'gemini-embedding-2-preview'
  | (string & {});

const googleEmbeddingContentPartSchema = z.union([
  z.object({ text: z.string() }),
  z.object({
    inlineData: z.object({
      mimeType: z.string(),
      data: z.string(),
    }),
  }),
  z.object({
    fileData: z.object({
      fileUri: z.string(),
      mimeType: z.string(),
    }),
  }),
]);

export const googleEmbeddingModelOptions = lazySchema(() =>
  zodSchema(
    z.object({
      /**
       * 选修的。输出嵌入的可选降维。
       * 如果设置，输出嵌入中过多的值将从末尾被截断。
       */
      outputDimensionality: z.number().optional(),

      /**
       * 选修的。指定生成嵌入的任务类型。
       * 支持的任务类型：
       * - SEMANTIC_SIMILARITY：针对文本相似性进行优化。
       * - 分类：针对文本分类进行了优化。
       * - 聚类：针对基于相似性的文本聚类进行了优化。
       * - RETRIEVAL_DOCUMENT：针对文档检索进行了优化。
       * - RETRIEVAL_QUERY：针对基于查询的检索进行了优化。
       * - QUESTION_ANSWERING：针对回答问题进行了优化。
       * - FACT_VERIFICATION：针对验证事实信息进行了优化。
       * - CODE_RETRIEVAL_QUERY：针对基于自然语言查询检索代码块进行了优化。
       */
      taskType: z
        .enum([
          'SEMANTIC_SIMILARITY',
          'CLASSIFICATION',
          'CLUSTERING',
          'RETRIEVAL_DOCUMENT',
          'RETRIEVAL_QUERY',
          'QUESTION_ANSWERING',
          'FACT_VERIFICATION',
          'CODE_RETRIEVAL_QUERY',
        ])
        .optional(),

      /**
       * 选修的。用于嵌入非文本的按值多模式内容部分
       * 内容（图像、视频、PDF、音频）。每个条目对应于
       * 同一索引处的嵌入值及其部分与
       * 请求中的文本值。对于纯文本条目使用“null”。
       *
       * 数组长度必须与嵌入的值的数量匹配。在
       * 单嵌入的情况下，数组长度必须为1。
       */
      content: z
        .array(z.array(googleEmbeddingContentPartSchema).min(1).nullable())
        .optional(),
    }),
  ),
);

export type GoogleEmbeddingModelOptions = InferSchema<
  typeof googleEmbeddingModelOptions
>;
