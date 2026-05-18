import type { JSONValue } from '../../json-value/json-value';
import type {
  SharedV4FileData,
  SharedV4FileDataData,
  SharedV4FileDataUrl,
} from '../../shared/v4/shared-v4-file-data';
import type { SharedV4ProviderOptions } from '../../shared/v4/shared-v4-provider-options';

/**
 * 提示是消息列表。
 *
 * 注意：并非所有模型和提示格式都支持多模态输入和
 * 工具调用。验证发生在运行时。
 *
 * 注意：这不是面向用户的提示。 AI SDK 方法将映射
 * 面向用户的提示类型（例如聊天或指令提示）采用此格式。
 */
export type LanguageModelV4Prompt = Array<LanguageModelV4Message>;

export type LanguageModelV4Message =
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
        content: Array<LanguageModelV4TextPart | LanguageModelV4FilePart>;
      }
    | {
        role: 'assistant';
        content: Array<
          | LanguageModelV4TextPart
          | LanguageModelV4FilePart
          | LanguageModelV4CustomPart
          | LanguageModelV4ReasoningPart
          | LanguageModelV4ReasoningFilePart
          | LanguageModelV4ToolCallPart
          | LanguageModelV4ToolResultPart
        >;
      }
    | {
        role: 'tool';
        content: Array<
          | LanguageModelV4ToolResultPart
          | LanguageModelV4ToolApprovalResponsePart
        >;
      }
  ) & {
    /**
     * 其他特定于提供商的选项。他们通过
     * 从 AI SDK 发送给提供商并启用特定于提供商的
     * 可以完全封装在提供者中的功能。
     */
    providerOptions?: SharedV4ProviderOptions;
  };

/**
 * 提示的文本内容部分。它包含一串文本。
 */
export interface LanguageModelV4TextPart {
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
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 推理内容是提示的一部分。它包含一串推理文本。
 */
export interface LanguageModelV4ReasoningPart {
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
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 推理文件内容是提示的一部分。它包含作为推理的一部分生成的文件。
 */
export interface LanguageModelV4ReasoningFilePart {
  type: 'reasoning-file';

  /**
   * 将数据文件作为标记的可区分联合：
   *
   * - `{ type: 'data', data }`：原始字节 (Uint8Array) 或 base64 编码的字符串。
   * - `{ type: 'url', url }`：指向文件的 URL。
   */
  data: SharedV4FileDataData | SharedV4FileDataUrl;

  /**
   * 文件的 IANA 媒体类型。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType: string;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 提示中特定于提供者的内容部分。它不包含标准化的
 * 有效负载超出了提供商特定的选项。
 */
export interface LanguageModelV4CustomPart {
  type: 'custom';

  /**
   * 自定义内容的类型，格式为“{provider}.{provider-type}”。
   */
  kind: `${string}.${string}`;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 文件内容是提示的一部分。它包含一个文件。
 */
export interface LanguageModelV4FilePart {
  type: 'file';

  /**
   * 文件的可选文件名。
   */
  filename?: string;

  /**
   * 将数据文件作为标记的可区分联合：
   *
   * - `{ type: 'data', data }`：原始字节 (Uint8Array) 或 base64 编码的字符串。
   * - `{ type: 'url', url }`：指向文件的 URL。
   * - `{ type: 'reference', reference }`：提供者引用 (`{ [provider]: id }`)。
   * - `{ type: 'text', text }`：内联文本内容（例如内联文本文档）。
   */
  data: SharedV4FileData;

  /**
   * 完整的 IANA 媒体类型（“类型/子类型”，例如“image/png”）或只是
   * 顶级 IANA 部分（例如“图像”、“音频”、“视频”、“文本”）。
   *
   * `*`-子类型通配符（例如`image/*`）被规范化为等同于
   * 单独的顶级段（例如“image”）。提供者可以使用以下帮助程序
   * `@ai-sdk/provider-utils` (`isFullMediaType`, `getTopLevelMediaType`,
   * `detectMediaType`) 根据其 API 解析该字段
   * 要求。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType: string;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 工具调用提示内容的一部分。它包含一个工具调用（通常由 AI 模型生成）。
 */
export interface LanguageModelV4ToolCallPart {
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
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 工具结果内容是提示的一部分。它包含具有匹配 ID 的工具调用结果。
 */
export interface LanguageModelV4ToolResultPart {
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
  output: LanguageModelV4ToolResultOutput;

  /**
   * 其他特定于提供商的选项。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 工具批准响应内容是提示的一部分。它包含用户的
 * 决定批准或拒绝提供商执行的工具调用。
 */
export interface LanguageModelV4ToolApprovalResponsePart {
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
  providerOptions?: SharedV4ProviderOptions;
}

/**
 * 工具调用的结果。
 */
export type LanguageModelV4ToolResultOutput =
  | {
      /**
       * 应直接发送到 API 的文本工具输出。
       */
      type: 'text';
      value: string;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV4ProviderOptions;
    }
  | {
      type: 'json';
      value: JSONValue;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV4ProviderOptions;
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
      providerOptions?: SharedV4ProviderOptions;
    }
  | {
      type: 'error-text';
      value: string;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV4ProviderOptions;
    }
  | {
      type: 'error-json';
      value: JSONValue;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: SharedV4ProviderOptions;
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
            providerOptions?: SharedV4ProviderOptions;
          }
        | {
            type: 'file';

            /**
             * 将数据文件作为标记的可区分联合：
             *
             * - `{ type: 'data', data }`：原始字节 (Uint8Array) 或 base64 编码的字符串。
             * - `{ type: 'url', url }`：指向文件的 URL。
             * - `{ type: 'reference', reference }`：提供者引用 (`{ [provider]: id }`)。
             * - `{ type: 'text', text }`：内联文本内容（例如内联文本文档）。
             */
            data: SharedV4FileData;

            /**
             * 完整的 IANA 媒体类型（“类型/子类型”，例如“image/png”）或只是
             * 顶级 IANA 部分（例如“图像”、“音频”、“视频”、“文本”）。
             *
             * `*`-子类型通配符（例如`image/*`）被规范化为等同于
             * 单独的顶级段（例如“image”）。提供者可以使用以下帮助程序
             * `@ai-sdk/provider-utils` (`isFullMediaType`, `getTopLevelMediaType`,
             * `detectMediaType`) 根据其 API 解析该字段
             * 要求。
             *
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
            providerOptions?: SharedV4ProviderOptions;
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
            providerOptions?: SharedV4ProviderOptions;
          }
      >;
    };
