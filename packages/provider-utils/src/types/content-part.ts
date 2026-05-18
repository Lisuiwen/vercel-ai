import type { JSONValue } from '@ai-sdk/provider';
import type { DataContent } from './data-content';
import type { FileData, FileDataData, FileDataUrl } from './file-data';
import type { ProviderOptions } from './provider-options';
import type { ProviderReference } from './provider-reference';

/**
 * 提示的文本内容部分。它包含一串文本。
 */
export interface TextPart {
  type: 'text';

  /**
   * 文字内容。
   */
  text: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * 提示的图像内容部分。它包含一个图像。
 *
 * @deprecated 将 `FilePart` 与 `mediaType: 'image'` 一起使用：
 * `{ 类型：'文件'，媒体类型：'图像'，数据：{ 类型：'数据'，数据 } }`。
 */
export interface ImagePart {
  type: 'image';

  /**
   * 图像数据。可以是：
   *
   * - data：base64 编码的字符串、Uint8Array、ArrayBuffer 或 Buffer
   * - URL：指向图像的URL
   * - ProviderReference：来自 `uploadFile` 的提供者引用
   */
  image: DataContent | URL | ProviderReference;

  /**
   * 图像的可选 IANA 媒体类型。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType?: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * 文件内容是提示的一部分。它包含一个文件。
 */
export interface FilePart {
  type: 'file';

  /**
   * 文件数据。标记的形状或简单的简写：
   *
   * - `{ type: 'data', data }` 或裸 `DataContent`：原始字节
   *   （base64 字符串、Uint8Array、ArrayBuffer、缓冲区）
   * - `{ type: 'url', url }` 或裸 `URL`：指向文件的 URL
   * - `{ type: 'reference', reference }` 或裸 `ProviderReference`:
   *   来自 `uploadFile` 的提供者引用
   * - `{ type: 'text', text }`：内联文本内容（仅标记）
   */
  data: FileData | DataContent | URL | ProviderReference;

  /**
   * 文件的可选文件名。
   */
  filename?: string;

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
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * 推理内容是提示的一部分。其中包含一个推理。
 */
export interface ReasoningPart {
  type: 'reasoning';

  /**
   * 推理文本。
   */
  text: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * 提示的自定义内容部分。它不包含超出标准的有效负载
 * 特定于提供商的选项。
 */
export interface CustomPart {
  type: 'custom';

  /**
   * 自定义内容的类型，格式为“{provider}.{provider-type}”。
   */
  kind: `${string}.${string}`;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * 推理文件内容是提示的一部分。它包含作为推理的一部分生成的文件。
 */
export interface ReasoningFilePart {
  type: 'reasoning-file';

  /**
   * 推理文件数据。
   *
   * 推理文件源自模型的推理输出，并且始终
   * 原始字节或可获取的 URL。与“FilePart.data”不同，“reference”和
   * 这里不支持“文本”形状：提供程序引用描述文件
   * 由用户上传（不作为模型输出生成），推理文本是
   * 由 `ReasoningPart` 携带，而不是作为文件。
   *
   * 标记的形状或简单的简写：
   *
   * - `{ type: 'data', data }` 或裸 `DataContent`：原始字节
   *   （base64 字符串、Uint8Array、ArrayBuffer、缓冲区）
   * - `{ type: 'url', url }` 或裸 `URL`：指向文件的 URL
   */
  data: FileDataData | FileDataUrl | DataContent | URL;

  /**
   * 文件的 IANA 媒体类型。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * 工具调用提示内容的一部分。它包含一个工具调用（通常由 AI 模型生成）。
 */
export interface ToolCallPart {
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
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;

  /**
   * 工具调用是否由提供者执行。
   */
  providerExecuted?: boolean;
}

/**
 * 工具结果内容是提示的一部分。它包含具有匹配 ID 的工具调用结果。
 */
export interface ToolResultPart {
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
   * 工具调用的结果。这是一个 JSON 可序列化对象。
   */
  output: ToolResultOutput;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;
}

/**
 * 工具结果的输出。
 */
export type ToolResultOutput =
  | {
      /**
       * 应直接发送到 API 的文本工具输出。
       */
      type: 'text';
      value: string;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: ProviderOptions;
    }
  | {
      type: 'json';
      value: JSONValue;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: ProviderOptions;
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
      providerOptions?: ProviderOptions;
    }
  | {
      type: 'error-text';
      value: string;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: ProviderOptions;
    }
  | {
      type: 'error-json';
      value: JSONValue;

      /**
       * 特定于提供商的选项。
       */
      providerOptions?: ProviderOptions;
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
            providerOptions?: ProviderOptions;
          }
        | {
            type: 'file';

            /**
             * 将数据文件作为标记的可区分联合：
             *
             * - `{ type: 'data', data }`：原始字节
             *   （base64 字符串、Uint8Array、ArrayBuffer、缓冲区）
             * - `{ type: 'url', url }`：指向文件的 URL
             * - `{ type: 'reference', reference }`：提供者引用
             *   来自“上传文件”
             * - `{ type: 'text', text }`：内联文本内容（例如内联
             *   文本文件）
             */
            data: FileData;

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
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 使用带有 mediaType + 标记数据的“文件”：
             * `{ 类型：'文件'，媒体类型，数据：{ 类型：'数据'，数据 } }`。
             */
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
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 将 'file' 与 mediaType 和标记数据一起使用：
             * `{ type: 'file', mediaType, data: { type: 'url', url: new URL(url) } }`。
             */
            type: 'file-url';

            /**
             * 文件的 URL。
             */
            url: string;

            /**
             * IANA 媒体类型。
             * @see https://www.iana.org/assignments/media-types/media-types.xhtml
             */
            mediaType?: string;

            /**
             * Provider-specific options.
             */
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 使用带有标记数据的“文件”：
             * `{ 类型：'文件'，媒体类型，数据：{ 类型：'引用'，引用 } }`。
             */
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
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 使用带有标记数据的“文件”：
             * `{ 类型：'文件'，媒体类型，数据：{ 类型：'引用'，引用 } }`。
             */
            type: 'file-reference';

            /**
             * 文件的特定于提供者的参考。
             * 关键是提供商名称，例如“openai”或“anthropic”。
             */
            providerReference: ProviderReference;

            /**
             * Provider-specific options.
             */
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 将“文件”与媒体类型一起使用（例如“图像”或特定的
             * `image/*` 子类型）和标记数据：
             * `{ 类型：'文件'，媒体类型：'图像'，数据：{ 类型：'数据'，数据 } }`。
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
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 将“file”与“mediaType: 'image'”（或特定的
             * `image/*` 子类型）和标记数据：
             * `{ type: 'file', mediaType: 'image', data: { type: 'url', url: new URL(url) } }`。
             */
            type: 'image-url';

            /**
             * 图像的 URL。
             */
            url: string;

            /**
             * Provider-specific options.
             */
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 将“file”与“mediaType: 'image'”（或特定的
             * `image/*` 子类型）和标记数据：
             * `{ 类型：'文件'，媒体类型：'图像'，数据：{ 类型：'参考'，参考 } }`。
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
            providerOptions?: ProviderOptions;
          }
        | {
            /**
             * @deprecated 将“file”与“mediaType: 'image'”（或特定的
             * `image/*` 子类型）和标记数据：
             * `{ 类型：'文件'，媒体类型：'图像'，数据：{ 类型：'参考'，参考 } }`。
             */
            type: 'image-file-reference';

            /**
             * 图像文件的提供商特定参考。
             * 关键是提供商名称，例如“openai”或“anthropic”。
             */
            providerReference: ProviderReference;

            /**
             * Provider-specific options.
             */
            providerOptions?: ProviderOptions;
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
            providerOptions?: ProviderOptions;
          }
      >;
    };
