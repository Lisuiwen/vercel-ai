import type { GatewayModelId } from '@ai-sdk/gateway';
import type {
  LanguageModelV2,
  LanguageModelV3,
  LanguageModelV4,
  SharedV4Warning,
  LanguageModelV4Source,
} from '@ai-sdk/provider';

declare global {
  /**
   * 全局接口，可以通过第三方包进行扩展以注册自定义模型 ID。
   *
   * 您可以通过两种方式注册模型 ID：
   *
   * 1. 根据提供商包中的模型 ID 进行注册：
   * @example
   * ``打字稿
   * 从'@ai-sdk/openai'导入{openai}；
   * 类型 OpenAIResponsesModelId = 参数<openai 类型>[0];
   *
   * 声明全局{
   *   接口 RegisteredProviderModels {
   *     openai：OpenAIResponsesModelId；
   *   }
   * }
   * ```
   *
   * 2. 直接将各个模型ID注册为密钥：
   * @example
   * ``打字稿
   * 声明全局{
   *   接口 RegisteredProviderModels {
   *     '我的提供商：我的模型'：任意；
   *     '我的提供商：另一个模型'：任何；
   *   }
   * }
   * ```
   */
  interface RegisteredProviderModels {}
}

/**
 * 全局提供程序模型 ID 类型，默认为 GatewayModelId 但可以增强
 * 通过第三方包通过声明合并。
 */
export type GlobalProviderModelId = [keyof RegisteredProviderModels] extends [
  never,
]
  ? GatewayModelId
  :
      | keyof RegisteredProviderModels
      | RegisteredProviderModels[keyof RegisteredProviderModels];

/**
 * AI SDK使用的语言模型。
 */
export type LanguageModel =
  | GlobalProviderModelId
  | LanguageModelV4
  | LanguageModelV3
  | LanguageModelV2;

/**
 * 语言模型完成生成响应的原因。
 *
 * 可以是以下之一：
 * - `stop`：模型生成的停止序列
 * - `length`：模型生成的最大令牌数
 * - `content-filter`：内容过滤器违规停止了模型
 * - `tool-calls`：模型触发的工具调用
 * - `error`：模型因错误而停止
 * - `other`：模型因其他原因停止
 */
export type FinishReason =
  | 'stop'
  | 'length'
  | 'content-filter'
  | 'tool-calls'
  | 'error'
  | 'other';

/**
 * 来自模型提供商对此调用的警告。呼叫将继续进行，但例如
 * 某些设置可能不受支持，这可能会导致结果不理想。
 */
export type CallWarning = SharedV4Warning;

/**
 * 已用作生成响应的输入的源。
 */
export type Source = LanguageModelV4Source;

/**
 * 一代人的工具选择。它支持以下设置：
 *
 * - `auto`（默认）：模型可以选择是否调用工具以及调用哪些工具。
 * - `required`：模型必须调用工具。它可以选择调用哪个工具。
 * - `none`：模型不能调用工具
 * - `{ type: 'tool', toolName: string (typed) }`：模型必须调用指定的工具
 */
export type ToolChoice<TOOLS extends Record<string, unknown>> =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'tool'; toolName: Extract<keyof TOOLS, string> };
