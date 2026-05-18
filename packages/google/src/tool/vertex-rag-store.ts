import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

// https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/use-vertexai-search#generate-content-using-gemini-api
// https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/rag-output-explained

/**
 * 一种工具，使模型能够针对 Vertex RAG 存储执行 RAG 搜索。
 *
 * @note Only works with Vertex Gemini models.
 */
export const vertexRagStore = createProviderExecutedToolFactory<
  {},
  {},
  {
    /**
     * RagCorpus 资源名称，例如：projects/{project}/locations/{location}/ragCorpora/{rag_corpus}
     */
    ragCorpus: string;

    /**
     * 要检索的顶级上下文的数量。
     */
    topK?: number;
  }
>({
  id: 'google.vertex_rag_store',
  inputSchema: lazySchema(() => zodSchema(z.object({}))),
  outputSchema: lazySchema(() => zodSchema(z.object({}))),
});
