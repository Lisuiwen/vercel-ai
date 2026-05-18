import type { JSONValue } from '../../json-value/json-value';
import type { SharedV3ProviderOptions } from '../../shared/v3/shared-v3-provider-options';
import type { LanguageModelV3DataContent } from './language-model-v3-data-content';

/**
 * 提示是消息列表。
 *
 * 注意：并非所有模型和提示格式都支持多模态输入和
 * 工具调用。验证发生在运行时。
 *
 * 注意：这不是面向用户的提示。 AI SDK 方法将映射
 * 面向用户的提示类型（例如聊天或指令提示）采用此格式。
 */
export type LanguageModelV3Prompt = Array<LanguageModelV3Message>;

export type LanguageModelV3Message =
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
        content: Array<LanguageModelV3TextPart | LanguageModelV3FilePart>;
      }
    | {
        role: 'assistant';
        content: Array<
          | LanguageModelV3TextPart
          | LanguageModelV3FilePart
          | LanguageModelV3ReasoningPart
          | LanguageModelV3ToolCallPart
          | LanguageModelV3ToolResultPart
        >;
      }
    | {
        role: 'tool';
        content: Array<
          | LanguageModelV3ToolResultPart
          | LanguageModelV3ToolApprovalResponsePart
        >;
      }
  ) & {
    /**
     * 其他特定于提供商的选项。他们通过
     * 从 AI SDK 发送给提供商并启用特定于提供商的
     * 可以完全封装在提供者中的功能。
     */
    providerOptions?: SharedV3ProviderOptions;
  };

/**
 * 提示的文本内容部分。它包含一串文本。
 */
export interface LanguageModelV3TextPart {
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
  providerOptions?: SharedV3ProviderOptions;
}

/**
 * 推理内容是提示的一部分。它包含一串推理文本。
 */
export interface LanguageModelV3ReasoningPart {
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
  providerOptions?: SharedV3ProviderOptions;
}

/**
 * 文件内容是提示的一部分。它包含一个文件。
 */
export interface LanguageModelV3FilePart {
  type: 'file';

  /**
   * 文件的可选文件名。
   */
  filename?: string;

  /**
   * 文件数据。可以是 Uint8Array、base64 编码的数据作为字符串或 URL。
   */
  data: LanguageModelV3DataContent;

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
  providerOptions?: SharedV3ProviderOptions;
}

/**
 * 工具调用提示内容的一部分。它包含一个工具调用（通常由 AI 模型生成）。
 */
export interface LanguageModelV3ToolCallPart {
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
  providerOptions?: SharedV3ProviderOptions;
}

/**
 * 工具结果内容是提示的一部分。它包含具有匹配 ID 的工具调用结果。
 */
export interface LanguageModelV3ToolResultPart {
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
  output: LanguageModelV3ToolResultOutput;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV3ProviderOptions;
}

/**
 * 工具批准响应内容是提示的一部分。它包含用户的
 * 决定批准或拒绝提供商执行的工具调用。
 */
export interface LanguageModelV3ToolApprovalResponsePart {
  type: 'tool-approval-response';

  /**
   * 此响应引用的批准请求的 ID。
   */
  approvalId: string;

  /**
   * 批准是被批准（正确）还是被拒绝（错误）。
   */
  approved: boolean;

  /**
   * 批准或拒绝的可选原因。
   */
  reason?: string;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV3ProviderOptions;
}

/**
 * 工具调用的结果。
 */
export type LanguageModelV3ToolResultOutput =
  | {
      /**
       * 应直接发送到 API 的文本工具输出。
       */
      type: 'text';
      value: string;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV3ProviderOptions;
    }
  | {
      type: 'json';
      value: JSONValue;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV3ProviderOptions;
    }
  | {
      /**
       * 当用户拒绝执行工具调用时键入。
       */
      type: 'execution-denied';

      /**
       * 拒绝执行的可选原因。
       */
      reason?: string;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV3ProviderOptions;
    }
  | {
      type: 'error-text';
      value: string;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV3ProviderOptions;
    }
  | {
      type: 'error-json';
      value: JSONValue;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV3ProviderOptions;
    }
  | {
      type: 'content';
      value: Array<
        | {
            type: 'text';

            /**
             * 文字内容。
             */
            text: string;

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
        | {
            type: 'file-data';

            /**
             * Base-64 编码的媒体数据。
             */
            data: string;

            /**
             * IANA 媒体类型。
             * @see https://www.iana.org/assignments/media-types/media-types.xhtml
             */
            mediaType: string;

            /**
             * 文件的可选文件名。
             */
            filename?: string;

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
        | {
            type: 'file-url';

            /**
             * 文件的 URL。
             */
            url: string;

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
        | {
            type: 'file-id';

            /**
             * 文件的 ID。
             *
             * 如果您使用多个提供商，则需要
             * 使用指定提供商特定的 id
             * 记录选项。关键是提供商
             * 名称，例如“openai”或“anthropic”。
             */
            fileId: string | Record<string, string>;

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
        | {
            /**
             * 使用 Base64 编码数据引用的图像。
             */
            type: 'image-data';

            /**
             * Base-64 编码的图像数据。
             */
            data: string;

            /**
             * IANA 媒体类型。
             * @see https://www.iana.org/assignments/media-types/media-types.xhtml
             */
            mediaType: string;

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
        | {
            /**
             * 使用 URL 引用的图像。
             */
            type: 'image-url';

            /**
             * 图像的 URL。
             */
            url: string;

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
        | {
            /**
             * 使用提供程序文件 ID 引用的图像。
             */
            type: 'image-file-id';

            /**
             * 使用提供程序文件 ID 引用的图像。
             *
             * 如果您使用多个提供商，则需要
             * 使用指定提供商特定的 id
             * 记录选项。关键是提供商
             * 名称，例如“openai”或“anthropic”。
             */
            fileId: string | Record<string, string>;

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
        | {
            /**
             * 自定义内容部分。这可以用来实现
             * 提供商特定的内容部分。
             */
            type: 'custom';

            /**
             * Provider-specific options.
             */
            providerOptions?: SharedV3ProviderOptions;
          }
      >;
    };
