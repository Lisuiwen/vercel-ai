import { codeExecution } from './tool/code-execution';
import { enterpriseWebSearch } from './tool/enterprise-web-search';
import { fileSearch } from './tool/file-search';
import { googleMaps } from './tool/google-maps';
import { googleSearch } from './tool/google-search';
import { urlContext } from './tool/url-context';
import { vertexRagStore } from './tool/vertex-rag-store';

export const googleTools = {
  /**
   * 创建一个 Google 搜索工具，使 Google 可以直接访问实时网络内容。
   * 名称必须为“google_search”。
   */
  googleSearch,

  /**
   * 创建企业 Web 搜索工具，使用注重合规性的 Web 索引来基础响应。
   * 专为严格监管的行业（金融、医疗保健、公共部门）而设计。
   * 不记录客户数据，支持VPC服务控制。
   * 名称必须为“enterprise_web_search”。
   *
   * @note Only available on Vertex AI. Requires Gemini 2.0 or newer.
   *
   * @see https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/web-grounding-enterprise
   */
  enterpriseWebSearch,

  /**
   * 创建一个 Google 地图基础工具，使模型能够访问 Google 地图数据。
   * 名称必须为“google_maps”。
   *
   * @see https://ai.google.dev/gemini-api/docs/maps-grounding
   * @see https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-maps
   */
  googleMaps,

  /**
   * 创建一个 URL 上下文工具，使 Google 可以直接访问实时网络内容。
   * 名称必须为“url_context”。
   */
  urlContext,

  /**
   * 通过 Gemini 文件搜索工具启用检索增强生成 (RAG)。
   * 名称必须为“file_search”。
   *
   * @param fileSearchStoreNames - Fully-qualified File Search store resource names.
   * @param metadataFilter - Optional filter expression to restrict the files that can be retrieved.
   * @param topK - Optional result limit for the number of chunks returned from File Search.
   *
   * @see https://ai.google.dev/gemini-api/docs/file-search
   */
  fileSearch,
  /**
   * 使模型能够生成并运行 Python 代码的工具。
   * 名称必须为“code_execution”。
   *
   * @note Ensure the selected model supports Code Execution.
   * 代码执行工具的多工具使用通常与 Gemini >=2 模型兼容。
   *
   * @see https://ai.google.dev/gemini-api/docs/code-execution (Google AI)
   * @see https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/code-execution-api (Vertex AI)
   */
  codeExecution,

  /**
   * 创建 Vertex RAG 存储工具，使模型能够针对 Vertex RAG 存储执行 RAG 搜索。
   * 名称必须为“vertex_rag_store”。
   */
  vertexRagStore,
};
