import { applyPatch } from './tool/apply-patch';
import { codeInterpreter } from './tool/code-interpreter';
import { customTool } from './tool/custom';
import { fileSearch } from './tool/file-search';
import { imageGeneration } from './tool/image-generation';
import { localShell } from './tool/local-shell';
import { shell } from './tool/shell';
import { toolSearch } from './tool/tool-search';
import { webSearch } from './tool/web-search';
import { webSearchPreview } from './tool/web-search-preview';
import { mcp } from './tool/mcp';

export const openaiTools = {
  /**
   * apply_patch 工具可让 GPT-5.1 创建、更新和删除您的文件
   * 使用结构化差异的代码库。该模型不仅仅是建议编辑
   * 发出应用程序应用的补丁操作，然后返回报告，
   * 支持迭代、多步骤的代码编辑工作流程。
   *
   */
  applyPatch,

  /**
   * 自定义工具允许调用者将模型输出限制为语法（正则表达式或
   * Lark 语法）。该模型返回一个“custom_tool_call”输出项，其
   * `input` 字段是与指定语法匹配的字符串。
   *
   * @param description - An optional description of the tool.
   * @param format - The output format constraint (grammar type, syntax, and definition).
   */
  customTool,

  /**
   * 代码解释器工具允许模型在以下环境中编写和运行 Python 代码：
   * 沙盒环境，用于解决数据分析等领域的复杂问题，
   * 编码和数学。
   *
   * @param container - The container to use for the code interpreter.
   */
  codeInterpreter,

  /**
   * 文件搜索是 Responses API 中提供的一个工具。它使模型能够
   * 通过以下方式检索先前上传文件的知识库中的信息
   * 语义和关键字搜索。
   *
   * @param vectorStoreIds - The vector store IDs to use for the file search.
   * @param maxNumResults - The maximum number of results to return.
   * @param ranking - The ranking options to use for the file search.
   * @param filters - The filters to use for the file search.
   */
  fileSearch,

  /**
   * 图像生成工具允许您使用文本提示生成图像，
   * 以及可选的图像输入。它利用 GPT 图像模型，
   * 并自动优化文本输入以提高性能。
   *
   * @param background - Background type for the generated image. One of 'auto', 'opaque', or 'transparent'.
   * @param inputFidelity - Input fidelity for the generated image. One of 'low' or 'high'.
   * @param inputImageMask - Optional mask for inpainting. Contains fileId and/or imageUrl.
   * @param model - The image generation model to use. Default: gpt-image-1.
   * @param moderation - Moderation level for the generated image. Default: 'auto'.
   * @param outputCompression - Compression level for the output image (0-100).
   * @param outputFormat - The output format of the generated image. One of 'png', 'jpeg', or 'webp'.
   * @param partialImages - Number of partial images to generate in streaming mode (0-3).
   * @param quality - The quality of the generated image. One of 'auto', 'low', 'medium', or 'high'.
   * @param size - The size of the generated image. One of 'auto', '1024x1024', '1024x1536', or '1536x1024'.
   */
  imageGeneration,

  /**
   * 本地shell是一个允许代理在本地运行shell命令的工具
   * 在您或用户提供的机器上。
   *
   * 支持的模型：`gpt-5-codex`
   */
  localShell,

  /**
   * shell 工具允许模型通过以下方式与本地计算机交互
   * 受控的命令行界面。该模型提出了 shell 命令；你的
   * 集成执行它们并返回输出。
   *
   * 可通过响应 API 与 GPT-5.1 一起使用。
   *
   * 警告：运行任意 shell 命令可能很危险。始终沙箱
   * 在将命令转发到之前执行或添加严格的允许/拒绝列表
   * 系统外壳。
   */
  shell,

  /**
   * 网络搜索允许模型从互联网获取最新信息
   * 并提供带有来源引文的答案。
   *
   * @param searchContextSize - The search context size to use for the web search.
   * @param userLocation - The user location to use for the web search.
   */
  webSearchPreview,

  /**
   * 网络搜索允许模型从互联网获取最新信息
   * 并提供带有来源引文的答案。
   *
   * @param filters - The filters to use for the web search.
   * @param searchContextSize - The search context size to use for the web search.
   * @param userLocation - The user location to use for the web search.
   */
  webSearch,

  /**
   * MCP（模型上下文协议）允许模型调用由
   * 远程 MCP 服务器或服务连接器。
   *
   * @param serverLabel - Label to identify the MCP server.
   * @param allowedTools - Allowed tool names or filter object.
   * @param authorization - OAuth access token for the MCP server/connector.
   * @param connectorId - Identifier for a service connector.
   * @param headers - Optional headers to include in MCP requests.
   * // 参数 requireApproval - 批准策略（'always'|'never'|过滤器对象）。 （已删除 - 始终为“从不”）
   * @param serverDescription - Optional description of the server.
   * @param serverUrl - URL for the MCP server.
   */
  mcp,

  /**
   * 搜索工具允许模型动态搜索并加载延迟
   * 根据需要将工具放入模型的上下文中。这有助于减少总体令牌
   * 仅在模型需要时加载工具，从而降低使用量、成本和延迟。
   *
   * 要使用工具搜索，请使用“defer_loading: true”标记函数或命名空间
   * 在工具数组中。该模型将使用工具搜索来加载这些工具
   * 当它确定需要它们时。
   */
  toolSearch,
};
