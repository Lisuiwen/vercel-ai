import type { JSONSchema7 } from 'json-schema';
import type { SharedV4ProviderOptions } from '../../shared/v4/shared-v4-provider-options';
import type { LanguageModelV4FunctionTool } from './language-model-v4-function-tool';
import type { LanguageModelV4Prompt } from './language-model-v4-prompt';
import type { LanguageModelV4ProviderTool } from './language-model-v4-provider-tool';
import type { LanguageModelV4ToolChoice } from './language-model-v4-tool-choice';

export type LanguageModelV4CallOptions = {
  /**
   * 语言模式提示是标准化的提示类型。
   *
   * 注意：这**不是**面向用户的提示。 AI SDK 方法将映射
   * 面向用户的提示类型（例如聊天或指令提示）采用此格式。
   * 这种方法使我们能够在不破坏用户体验的情况下改进用户面临的提示
   * 语言模型接口。
   */
  prompt: LanguageModelV4Prompt;

  /**
   * 生成的最大令牌数。
   */
  maxOutputTokens?: number;

  /**
   * 温度设定。范围取决于提供商和模型。
   */
  temperature?: number;

  /**
   * 停止序列。
   * 如果设置，模型将在生成停止序列之一时停止生成文本。
   * 提供商可能对停止序列的数量有限制。
   */
  stopSequences?: string[];

  /**
   * 细胞核取样。
   */
  topP?: number;

  /**
   * 对于每个后续标记，仅从前 K 个选项中进行采样。
   *
   * 用于删除“长尾”低概率响应。
   * 仅推荐用于高级用例。通常您只需要使用温度。
   */
  topK?: number;

  /**
   * 存在惩罚设置。它影响模型的可能性
   * 重复提示中已有的信息。
   */
  presencePenalty?: number;

  /**
   * 频率惩罚设置。它影响模型的可能性
   * 重复使用相同的单词或短语。
   */
  frequencyPenalty?: number;

  /**
   * 响应格式。输出可以是文本或 JSON。默认为文本。
   *
   * 如果选择 JSON，则可以选择提供模式来指导 LLM。
   */
  responseFormat?:
    | { type: 'text' }
    | {
        type: 'json';

        /**
         * 生成的输出应符合的 JSON 架构。
         */
        schema?: JSONSchema7;

        /**
         * 应生成的输出的名称。一些提供商将其用于额外的法学硕士指导。
         */
        name?: string;

        /**
         * 应生成的输出的描述。一些提供商将其用于额外的法学硕士指导。
         */
        description?: string;
      };

  /**
   * 用于随机采样的种子（整数）。如果设置并支持
   * 根据模型，调用将生成确定性结果。
   */
  seed?: number;

  /**
   * 可用于模型的工具。
   */
  tools?: Array<LanguageModelV4FunctionTool | LanguageModelV4ProviderTool>;

  /**
   * 指定应如何选择工具。默认为“自动”。
   */
  toolChoice?: LanguageModelV4ToolChoice;

  /**
   * 在流中包含原始块。仅适用于流式通话。
   */
  includeRawChunks?: boolean;

  /**
   * 用于取消操作的中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 与请求一起发送的附加 HTTP 标头。
   * 仅适用于基于 HTTP 的提供商。
   */
  headers?: Record<string, string | undefined>;

  /**
   * 模型的推理努力水平。控制推理的多少
   * 模型在生成响应之前执行。默认为“提供商默认”。
   */
  reasoning?:
    | 'provider-default'
    | 'none'
    | 'minimal'
    | 'low'
    | 'medium'
    | 'high'
    | 'xhigh';

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV4ProviderOptions;
};
