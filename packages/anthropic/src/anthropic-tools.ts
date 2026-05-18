import { advisor_20260301 } from './tool/advisor_20260301';
import { bash_20241022 } from './tool/bash_20241022';
import { bash_20250124 } from './tool/bash_20250124';
import { codeExecution_20250522 } from './tool/code-execution_20250522';
import { codeExecution_20250825 } from './tool/code-execution_20250825';
import { codeExecution_20260120 } from './tool/code-execution_20260120';
import { computer_20241022 } from './tool/computer_20241022';
import { computer_20250124 } from './tool/computer_20250124';
import { computer_20251124 } from './tool/computer_20251124';
import { memory_20250818 } from './tool/memory_20250818';
import { textEditor_20241022 } from './tool/text-editor_20241022';
import { textEditor_20250124 } from './tool/text-editor_20250124';
import { textEditor_20250429 } from './tool/text-editor_20250429';
import { textEditor_20250728 } from './tool/text-editor_20250728';
import { toolSearchBm25_20251119 } from './tool/tool-search-bm25_20251119';
import { toolSearchRegex_20251119 } from './tool/tool-search-regex_20251119';
import { webFetch_20260209 } from './tool/web-fetch-20260209';
import { webFetch_20250910 } from './tool/web-fetch-20250910';
import { webSearch_20260209 } from './tool/web-search_20260209';
import { webSearch_20250305 } from './tool/web-search_20250305';

export const anthropicTools = {
  /**
   * 将更快的执行器模型与更高智能的顾问模型配对
   * 为中期一代提供战略指导。
   *
   * 顾问让更快、成本更低的执行者模型咨询
   * 服务器端的更高智能顾问模型。顾问阅读
   * 遗嘱执行人的完整成绩单并制定计划或路线修正；
   * 执行者根据建议继续执行任务。所有的
   * 这发生在单个“/v1/messages”请求内。
   *
   * Beta 标头 `advisor-tool-2026-03-01` 会自动添加
   * 包括工具。
   *
   * 多轮对话：传递完整的助手内容（包括
   * `advisor_tool_result` 块）在后续回合中返回到 API。如果
   * 您在后续回合中省略了“tools”中的顾问工具，而
   * 消息历史记录仍然包含“advisor_tool_result”块，API
   * 返回“400 invalid_request_error”。
   *
   * 支持的执行器模型：Claude Haiku 4.5、Sonnet 4.6、Opus 4.6、
   * 作品 4.7。顾问必须至少与执行人一样有能力。
   *
   * @param model - The advisor model ID (required), e.g. `"claude-opus-4-7"`.
   * @param maxUses - Maximum advisor calls per request (per-request cap).
   * @param caching - Enables prompt caching for the advisor's transcript
   * 对话中的跨通话。值得约 3 次顾问来电
   * 每次谈话。
   */
  advisor_20260301,

  /**
   * bash 工具使 Claude 能够在持久的 bash 会话中执行 shell 命令，
   * 允许系统操作、脚本执行和命令行自动化。
   *
   * 支持图像结果。
   */
  bash_20241022,

  /**
   * bash 工具使 Claude 能够在持久的 bash 会话中执行 shell 命令，
   * 允许系统操作、脚本执行和命令行自动化。
   *
   * 支持图像结果。
   */
  bash_20250124,

  /**
   * 克劳德可以分析数据、创建可视化、执行复杂的计算、
   * 运行系统命令、创建和编辑文件以及直接在其中处理上传的文件
   * API 对话。
   *
   * 代码执行工具允许Claude运行Bash命令和操作文件，
   * 包括在安全的沙盒环境中编写代码。
   */
  codeExecution_20250522,

  /**
   * 克劳德可以分析数据、创建可视化、执行复杂的计算、
   * 运行系统命令、创建和编辑文件以及直接在其中处理上传的文件
   * API 对话。
   *
   * 代码执行工具允许 Claude 运行 Python 和 Bash 命令并操作文件，
   * 包括在安全的沙盒环境中编写代码。
   *
   * 这是最新版本，增强了 Bash 支持和文件操作。
   */
  codeExecution_20250825,

  /**
   * 克劳德可以分析数据、创建可视化、执行复杂的计算、
   * 运行系统命令、创建和编辑文件以及直接在其中处理上传的文件
   * API 对话。
   *
   * 代码执行工具允许 Claude 运行 Python 和 Bash 命令并操作文件，
   * 包括在安全的沙盒环境中编写代码。
   *
   * 这是推荐版本。不需要 beta 标头。
   *
   * 支持的模型：克劳德 Opus 4.6、Sonnet 4.6、Sonnet 4.5、Opus 4.5
   */
  codeExecution_20260120,

  /**
   * 克劳德可以通过计算机使用工具与计算机环境进行交互，
   * 提供屏幕截图功能和鼠标/键盘控制，以实现自主桌面交互。
   *
   * 支持图像结果。
   *
   * @param displayWidthPx - The width of the display being controlled by the model in pixels.
   * @param displayHeightPx - The height of the display being controlled by the model in pixels.
   * @param displayNumber - The display number to control (only relevant for X11 environments). If specified, the tool will be provided a display number in the tool definition.
   */
  computer_20241022,

  /**
   * 克劳德可以通过计算机使用工具与计算机环境进行交互，
   * 提供屏幕截图功能和鼠标/键盘控制，以实现自主桌面交互。
   *
   * 支持图像结果。
   *
   * @param displayWidthPx - The width of the display being controlled by the model in pixels.
   * @param displayHeightPx - The height of the display being controlled by the model in pixels.
   * @param displayNumber - The display number to control (only relevant for X11 environments). If specified, the tool will be provided a display number in the tool definition.
   */
  computer_20250124,

  /**
   * 克劳德可以通过计算机使用工具与计算机环境进行交互，
   * 提供屏幕截图功能和鼠标/键盘控制，以实现自主桌面交互。
   *
   * 此版本添加了缩放操作以进行详细的屏幕区域检查。
   *
   * 支持图像结果。
   *
   * 支持的模型：克劳德 Opus 4.5
   *
   * @param displayWidthPx - The width of the display being controlled by the model in pixels.
   * @param displayHeightPx - The height of the display being controlled by the model in pixels.
   * @param displayNumber - The display number to control (only relevant for X11 environments). If specified, the tool will be provided a display number in the tool definition.
   * @param enableZoom - Enable zoom action. Set to true to allow Claude to zoom into specific screen regions. Default: false.
   */
  computer_20251124,

  /**
   * 记忆工具使克劳德能够通过记忆文件目录存储和检索对话中的信息。
   * 克劳德可以创建、读取、更新和删除会话之间持续存在的文件，
   * 允许它随着时间的推移积累知识，而无需将所有内容都保留在上下文窗口中。
   * 内存工具在客户端运行——您可以通过自己的基础设施控制数据的存储位置和方式。
   *
   * 支持的模型：克劳德十四行诗 4.5、克劳德十四行诗 4、克劳德 Opus 4.1、克劳德 Opus 4。
   */
  memory_20250818,

  /**
   * Claude 可以使用 Anthropic 定义的文本编辑器工具来查看和修改文本文件，
   * 帮助您调试、修复和改进代码或其他文本文档。这让克劳德
   * 直接与您的文件交互，提供实际帮助，而不仅仅是建议更改。
   *
   * 支持的模型：克劳德十四行诗 3.5
   */
  textEditor_20241022,

  /**
   * Claude 可以使用 Anthropic 定义的文本编辑器工具来查看和修改文本文件，
   * 帮助您调试、修复和改进代码或其他文本文档。这让克劳德
   * 直接与您的文件交互，提供实际帮助，而不仅仅是建议更改。
   *
   * 支持的模型：克劳德十四行诗 3.7
   */
  textEditor_20250124,

  /**
   * Claude 可以使用 Anthropic 定义的文本编辑器工具来查看和修改文本文件，
   * 帮助您调试、修复和改进代码或其他文本文档。这让克劳德
   * 直接与您的文件交互，提供实际帮助，而不仅仅是建议更改。
   *
   * 注意：该版本不支持“undo_edit”命令。
   *
   * @deprecated 使用textEditor_20250728代替
   */
  textEditor_20250429,

  /**
   * Claude 可以使用 Anthropic 定义的文本编辑器工具来查看和修改文本文件，
   * 帮助您调试、修复和改进代码或其他文本文档。这让克劳德
   * 直接与您的文件交互，提供实际帮助，而不仅仅是建议更改。
   *
   * 注意：该版本不支持“undo_edit”命令，并添加了可选的 max_characters 参数。
   *
   * 支持的模型：Claude Sonnet 4、Opus 4 和 Opus 4.1
   *
   * @param maxCharacters - Optional maximum number of characters to view in the file
   */
  textEditor_20250728,

  /**
   * 创建一个 Web 获取工具，使 Claude 可以直接访问实时 Web 内容。
   *
   * @param maxUses - The max_uses parameter limits the number of web fetches performed
   * @param allowedDomains - Only fetch from these domains
   * @param blockedDomains - Never fetch from these domains
   * @param citations - Unlike web search where citations are always enabled, citations are optional for web fetch. Set "citations": {"enabled": true} to enable Claude to cite specific passages from fetched documents.
   * @param maxContentTokens - The max_content_tokens parameter limits the amount of content that will be included in the context.
   */
  webFetch_20250910,

  /**
   * 创建一个 Web 获取工具，使 Claude 可以直接访问实时 Web 内容。
   *
   * @param maxUses - The max_uses parameter limits the number of web fetches performed
   * @param allowedDomains - Only fetch from these domains
   * @param blockedDomains - Never fetch from these domains
   * @param citations - Unlike web search where citations are always enabled, citations are optional for web fetch. Set "citations": {"enabled": true} to enable Claude to cite specific passages from fetched documents.
   * @param maxContentTokens - The max_content_tokens parameter limits the amount of content that will be included in the context.
   */
  webFetch_20260209,

  /**
   * 创建一个网络搜索工具，使 Claude 可以直接访问实时网络内容。
   *
   * @param maxUses - Maximum number of web searches Claude can perform during the conversation.
   * @param allowedDomains - Optional list of domains that Claude is allowed to search.
   * @param blockedDomains - Optional list of domains that Claude should avoid when searching.
   * @param userLocation - Optional user location information to provide geographically relevant search results.
   */
  webSearch_20250305,

  /**
   * 创建一个网络搜索工具，使 Claude 可以直接访问实时网络内容。
   *
   * @param maxUses - Maximum number of web searches Claude can perform during the conversation.
   * @param allowedDomains - Optional list of domains that Claude is allowed to search.
   * @param blockedDomains - Optional list of domains that Claude should avoid when searching.
   * @param userLocation - Optional user location information to provide geographically relevant search results.
   */
  webSearch_20260209,

  /**
   * 创建一个使用正则表达式模式来查找工具的工具搜索工具。
   *
   * 工具搜索工具使 Claude 能够使用数百或数千种工具
   * 通过动态发现并按需加载它们。而不是加载全部
   * 工具定义预先放入上下文窗口中，Claude 搜索您的工具
   * 目录并仅加载所需的工具。
   *
   * 在其他工具上使用“providerOptions: { anthropic: { deferLoading: true } }”
   * 将它们标记为延迟加载。
   *
   * 支持的模型：Claude Opus 4.5、Claude Sonnet 4.5
   */
  toolSearchRegex_20251119,

  /**
   * 创建一个使用 BM25（自然语言）来查找工具的工具搜索工具。
   *
   * 工具搜索工具使 Claude 能够使用数百或数千种工具
   * 通过动态发现并按需加载它们。而不是加载全部
   * 工具定义预先放入上下文窗口中，Claude 搜索您的工具
   * 目录并仅加载所需的工具。
   *
   * 在其他工具上使用“providerOptions: { anthropic: { deferLoading: true } }”
   * 将它们标记为延迟加载。
   *
   * 支持的模型：Claude Opus 4.5、Claude Sonnet 4.5
   */
  toolSearchBm25_20251119,
};
