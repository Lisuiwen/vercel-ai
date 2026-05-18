import {
  TooManyEmbeddingValuesForCallError,
  type EmbeddingModelV4,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  lazySchema,
  parseProviderOptions,
  postJsonToApi,
  resolve,
  serializeModelOptions,
  WORKFLOW_SERIALIZE,
  WORKFLOW_DESERIALIZE,
  zodSchema,
  type FetchFunction,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';
import { googleFailedResponseHandler } from './google-error';
import {
  googleEmbeddingModelOptions,
  type GoogleEmbeddingModelId,
} from './google-embedding-model-options';
type GoogleEmbeddingConfig = {
  provider: string;
  baseURL: string;
  headers?: () => Record<string, string | undefined>;
  fetch?: FetchFunction;
};

export class GoogleEmbeddingModel implements EmbeddingModelV4 {
  readonly specificationVersion = 'v4';
  readonly modelId: GoogleEmbeddingModelId;
  readonly maxEmbeddingsPerCall = 2048;
  readonly supportsParallelCalls = true;

  private readonly config: GoogleEmbeddingConfig;

  static [WORKFLOW_SERIALIZE](model: GoogleEmbeddingModel) {
    return serializeModelOptions({
      modelId: model.modelId,
      config: model.config,
    });
  }

  static [WORKFLOW_DESERIALIZE](options: {
    modelId: string;
    config: GoogleEmbeddingConfig;
  }) {
    return new GoogleEmbeddingModel(options.modelId, options.config);
  }

  get provider(): string {
    return this.config.provider;
  }
  constructor(modelId: GoogleEmbeddingModelId, config: GoogleEmbeddingConfig) {
    this.modelId = modelId;
    this.config = config;
  }

  async doEmbed({
    values,
    headers,
    abortSignal,
    providerOptions,
  }: Parameters<EmbeddingModelV4['doEmbed']>[0]): Promise<
    Awaited<ReturnType<EmbeddingModelV4['doEmbed']>>
  > {
    // 解析提供者选项
    const googleOptions = await parseProviderOptions({
      provider: 'google',
      providerOptions,
      schema: googleEmbeddingModelOptions,
    });

    if (values.length > this.maxEmbeddingsPerCall) {
      throw new TooManyEmbeddingValuesForCallError({
        provider: this.provider,
        modelId: this.modelId,
        maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
        values,
      });
    }

    const mergedHeaders = combineHeaders(
      this.config.headers ? await resolve(this.config.headers) : undefined,
      headers,
    );

    const multimodalContent = googleOptions?.content;

    if (
      multimodalContent != null &&
      multimodalContent.length !== values.length
    ) {
      throw new Error(
        `The number of multimodal content entries (${multimodalContent.length}) must match the number of values (${values.length}).`,
      );
    }

    // 对于单个嵌入，请使用单个端点
    if (values.length === 1) {
      const valueParts = multimodalContent?.[0];
      const textPart = values[0] ? [{ text: values[0] }] : [];
      const parts =
        valueParts != null
          ? [...textPart, ...valueParts]
          : [{ text: values[0] }];

      const {
        responseHeaders,
        value: response,
        rawValue,
      } = await postJsonToApi({
        url: `${this.config.baseURL}/models/${this.modelId}:embedContent`,
        headers: mergedHeaders,
        body: {
          model: `models/${this.modelId}`,
          content: {
            parts,
          },
          outputDimensionality: googleOptions?.outputDimensionality,
          taskType: googleOptions?.taskType,
        },
        failedResponseHandler: googleFailedResponseHandler,
        successfulResponseHandler: createJsonResponseHandler(
          googleGenerativeAISingleEmbeddingResponseSchema,
        ),
        abortSignal,
        fetch: this.config.fetch,
      });

      return {
        warnings: [],
        embeddings: [response.embedding.values],
        usage: undefined,
        response: { headers: responseHeaders, body: rawValue },
      };
    }

    // 对于多个值，请使用批处理端点
    const {
      responseHeaders,
      value: response,
      rawValue,
    } = await postJsonToApi({
      url: `${this.config.baseURL}/models/${this.modelId}:batchEmbedContents`,
      headers: mergedHeaders,
      body: {
        requests: values.map((value, index) => {
          const valueParts = multimodalContent?.[index];
          const textPart = value ? [{ text: value }] : [];
          return {
            model: `models/${this.modelId}`,
            content: {
              role: 'user',
              parts:
                valueParts != null
                  ? [...textPart, ...valueParts]
                  : [{ text: value }],
            },
            outputDimensionality: googleOptions?.outputDimensionality,
            taskType: googleOptions?.taskType,
          };
        }),
      },
      failedResponseHandler: googleFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        googleGenerativeAITextEmbeddingResponseSchema,
      ),
      abortSignal,
      fetch: this.config.fetch,
    });

    return {
      warnings: [],
      embeddings: response.embeddings.map(item => item.values),
      usage: undefined,
      response: { headers: responseHeaders, body: rawValue },
    };
  }
}

// 架构的最小版本，重点关注实现所需的内容
// 这种方法可以限制 API 更改时的损坏并提高效率
const googleGenerativeAITextEmbeddingResponseSchema = lazySchema(() =>
  zodSchema(
    z.object({
      embeddings: z.array(z.object({ values: z.array(z.number()) })),
    }),
  ),
);

// 单嵌入响应的架构
const googleGenerativeAISingleEmbeddingResponseSchema = lazySchema(() =>
  zodSchema(
    z.object({
      embedding: z.object({ values: z.array(z.number()) }),
    }),
  ),
);
