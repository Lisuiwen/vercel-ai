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
 * -“未知”：模型尚未传输完成原因
 */
export type LanguageModelV2FinishReason =
  | 'stop' // 模型生成的停止序列
  | 'length' // 模型生成的最大令牌数
  | 'content-filter' // 内容过滤器违规停止了模型
  | 'tool-calls' // 模型触发工具调用
  | 'error' // 模型因错误而停止
  | 'other' // 模型因其他原因停止
  | 'unknown'; // 该模型尚未传输完成原因
