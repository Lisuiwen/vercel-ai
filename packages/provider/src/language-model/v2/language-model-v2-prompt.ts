import type { JSONValue } from '../../json-value/json-value';
import type { SharedV2ProviderOptions } from '../../shared/v2/shared-v2-provider-options';
import type { LanguageModelV2DataContent } from './language-model-v2-data-content';

/**
 * 提示是消息列表。
 *
 * 注意：并非所有模型和提示格式都支持多模态输入和
 * 工具调用。验证发生在运行时。
 *
 * 注意：这不是面向用户的提示。 AI SDK 方法将映射
 * 面向用户的提示类型（例如聊天或指令提示）采用此格式。
 */
export type LanguageModelV2Prompt = Array<LanguageModelV2Message>;

export type LanguageModelV2Message =
  // 注意：将来每个角色可能会有额外的部分，
  // 例如当助手可以返回图像或用户可以共享文件时
  // 例如 PDF。
  (
    | {
        role: 'system';
        content: string;
      }
    | {
        role: 'user';
        content: Array<LanguageModelV2TextPart | LanguageModelV2FilePart>;
      }
    | {
        role: 'assistant';
        content: Array<
          | LanguageModelV2TextPart
          | LanguageModelV2FilePart
          | LanguageModelV2ReasoningPart
          | LanguageModelV2ToolCallPart
          | LanguageModelV2ToolResultPart
        >;
      }
    | {
        role: 'tool';
        content: Array<LanguageModelV2ToolResultPart>;
      }
  ) & {
    /**
     * 其他特定于提供商的选项。他们通过
     * 从 AI SDK 发送给提供商并启用特定于提供商的
     * 可以完全封装在提供者中的功能。
     */
    providerOptions?: SharedV2ProviderOptions;
  };

/**
 * 提示的文本内容部分。它包含一串文本。
 */
export interface LanguageModelV2TextPart {
  type: 'text';

  /**
   * 文字内容。
   */
  text: string;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV2ProviderOptions;
}

/**
 * 推理内容是提示的一部分。它包含一串推理文本。
 */
export interface LanguageModelV2ReasoningPart {
  type: 'reasoning';

  /**
   * 推理文本。
   */
  text: string;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV2ProviderOptions;
}

/**
 * 文件内容是提示的一部分。它包含一个文件。
 */
export interface LanguageModelV2FilePart {
  type: 'file';

  /**
   * 文件的可选文件名。
   */
  filename?: string;

  /**
   * 文件数据。可以是 Uint8Array、base64 编码的数据作为字符串或 URL。
   */
  data: LanguageModelV2DataContent;

  /**
   * 文件的 IANA 媒体类型。
   *
   * 可以支持通配符，例如`image/*`（在这种情况下，提供商需要采取适当的措施）。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType: string;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV2ProviderOptions;
}

/**
 * 工具调用提示内容的一部分。它包含一个工具调用（通常由 AI 模型生成）。
 */
export interface LanguageModelV2ToolCallPart {
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
   * 工具调用是否将由提供者执行。
   * 如果此标志未设置或为 false，则工具调用将由客户端执行。
   */
  providerExecuted?: boolean;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV2ProviderOptions;
}

/**
 * 工具结果内容是提示的一部分。它包含具有匹配 ID 的工具调用结果。
 */
export interface LanguageModelV2ToolResultPart {
  type: 'tool-result';

  /**
   * 与该结果关联的工具调用的 ID。
   */
  toolCallId: string;

  /**
   * 生成此结果的工具的名称。
   */
  toolName: string;

  /**
   * 工具调用的结果。
   */
  output: LanguageModelV2ToolResultOutput;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV2ProviderOptions;
}

export type LanguageModelV2ToolResultOutput =
  | { type: 'text'; value: string }
  | { type: 'json'; value: JSONValue }
  | { type: 'error-text'; value: string }
  | { type: 'error-json'; value: JSONValue }
  | {
      type: 'content';
      value: Array<
        | {
            type: 'text';

            /**
             * 文字内容。
             */
            text: string;
          }
        | {
            type: 'media';

            /**
             * Base-64 编码的媒体数据。
             */
            data: string;

            /**
             * IANA 媒体类型。
             * @see https://www.iana.org/assignments/media-types/media-types.xhtml
             */
            mediaType: string;
          }
      >;
    };
