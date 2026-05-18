import type { JSONObject } from '@ai-sdk/provider';
import type {
  InferToolInput,
  InferToolOutput,
  Tool,
  ToolCall,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { ProviderMetadata } from '../types/provider-metadata';
import type { ProviderReference } from '../types/provider-reference';
import type { DeepPartial } from '../util/deep-partial';
import type { ValueOf } from '../util/value-of';

/**
 * 可在 UI 消息中用于 UI 消息数据部分的数据类型。
 */
export type UIDataTypes = Record<string, unknown>;

export type UITool = {
  input: unknown;
  output: unknown | undefined;
};

/**
 * 推断工具的输入和输出类型，以便将其用作 UI 工具。
 */
export type InferUITool<TOOL extends Tool> = {
  input: InferToolInput<TOOL>;
  output: InferToolOutput<TOOL>;
};

/**
 * 推断工具集的输入和输出类型，以便将其用作 UI 工具集。
 */
export type InferUITools<TOOLS extends ToolSet> = {
  [NAME in keyof TOOLS & string]: InferUITool<TOOLS[NAME]>;
};

export type UITools = Record<string, UITool>;

/**
 * AI SDK UI 消息。它们用于客户端并在前端和 API 路由之间进行通信。
 */
export interface UIMessage<
  METADATA = unknown,
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS extends UITools = UITools,
> {
  /**
   * 消息的唯一标识符。
   */
  id: string;

  /**
   * 消息的作用。
   */
  role: 'system' | 'user' | 'assistant';

  /**
   * 消息的元数据。
   */
  metadata?: METADATA;

  /**
   * 消息的各个部分。使用它在 UI 中呈现消息。
   *
   * 应避免系统消息（而是在服务器上设置系统提示符）。
   * 它们可以有文本部分。
   *
   * 用户消息可以包含文本部分和文件部分。
   *
   * 助理消息可以包含文本、推理、工具调用和文件部分。
   */
  parts: Array<UIMessagePart<DATA_PARTS, TOOLS>>;
}

export type UIMessagePart<
  DATA_TYPES extends UIDataTypes,
  TOOLS extends UITools,
> =
  | TextUIPart
  | CustomContentUIPart
  | ReasoningUIPart
  | ToolUIPart<TOOLS>
  | DynamicToolUIPart
  | SourceUrlUIPart
  | SourceDocumentUIPart
  | FileUIPart
  | ReasoningFileUIPart
  | DataUIPart<DATA_TYPES>
  | StepStartUIPart;

/**
 * 消息的文本部分。
 */
export type TextUIPart = {
  type: 'text';

  /**
   * 文字内容。
   */
  text: string;

  /**
   * 文本部分的状态。
   */
  state?: 'streaming' | 'done';

  /**
   * 提供者元数据。
   */
  providerMetadata?: ProviderMetadata;
};

/**
 * 消息的特定于提供者的部分。
 */
export type CustomContentUIPart = {
  type: 'custom';

  /**
   * 自定义内容的类型，格式为“{provider}.{provider-type}”。
   */
  kind: `${string}.${string}`;

  /**
   * 提供者元数据。
   */
  providerMetadata?: ProviderMetadata;
};

/**
 * 消息的推理部分。
 */
export type ReasoningUIPart = {
  type: 'reasoning';

  /**
   * 推理文本。
   */
  text: string;

  /**
   * 推理部分的状态。
   */
  state?: 'streaming' | 'done';

  /**
   * 提供者元数据。
   */
  providerMetadata?: ProviderMetadata;
};

/**
 * 消息的源部分。
 */
export type SourceUrlUIPart = {
  type: 'source-url';
  sourceId: string;
  url: string;
  title?: string;
  providerMetadata?: ProviderMetadata;
};

/**
 * 消息的文档源部分。
 */
export type SourceDocumentUIPart = {
  type: 'source-document';
  sourceId: string;
  mediaType: string;
  title: string;
  filename?: string;
  providerMetadata?: ProviderMetadata;
};

/**
 * 消息的文件部分。
 */
export type FileUIPart = {
  type: 'file';

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
   * 文件的 URL。
   * 它可以是托管文件的 URL，也可以是[数据 URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)。
   */
  url: string;

  /**
   * 通过“uploadFile”上传的文件的提供者参考。
   * 将提供程序名称映射到提供程序特定的文件标识符。
   * 如果存在，则在模型消息中优先于“url”。
   */
  providerReference?: ProviderReference;

  /**
   * 提供者元数据。
   */
  providerMetadata?: ProviderMetadata;
};

/**
 * 消息的推理文件部分。
 */
export type ReasoningFileUIPart = {
  type: 'reasoning-file';

  /**
   * 文件的 IANA 媒体类型。
   *
   * @see https://www.iana.org/assignments/media-types/media-types.xhtml
   */
  mediaType: string;

  /**
   * 文件的 URL。
   * 它可以是托管文件的 URL，也可以是[数据 URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)。
   */
  url: string;

  /**
   * 提供者元数据。
   */
  providerMetadata?: ProviderMetadata;
};

/**
 * 消息的步骤边界部分。
 */
export type StepStartUIPart = {
  type: 'step-start';
};

export type DataUIPart<DATA_TYPES extends UIDataTypes> = ValueOf<{
  [NAME in keyof DATA_TYPES & string]: {
    type: `data-${NAME}`;
    id?: string;
    data: DATA_TYPES[NAME];
  };
}>;

type asUITool<TOOL extends UITool | Tool> = TOOL extends Tool
  ? InferUITool<TOOL>
  : TOOL;

/**
 * 检查消息部分是否是数据部分。
 */
export function isDataUIPart<DATA_TYPES extends UIDataTypes>(
  part: UIMessagePart<DATA_TYPES, UITools>,
): part is DataUIPart<DATA_TYPES> {
  return part.type.startsWith('data-');
}

/**
 * UI 工具调用包含在 UI 中呈现工具调用所需的所有信息。
 * 它可以在不知道工具名称的情况下从工具派生出来，并且可以用来定义
 * 该工具的 UI 组件。
 */
export type UIToolInvocation<TOOL extends UITool | Tool> = {
  /**
   * 工具调用的 ID。
   */
  toolCallId: string;
  title?: string;
  toolMetadata?: JSONObject;

  /**
   * 工具调用是否由提供者执行。
   */
  providerExecuted?: boolean;
} & (
  | {
      state: 'input-streaming';
      input: DeepPartial<asUITool<TOOL>['input']> | undefined;
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval?: never;
    }
  | {
      state: 'input-available';
      input: asUITool<TOOL>['input'];
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval?: never;
    }
  | {
      state: 'approval-requested';
      input: asUITool<TOOL>['input'];
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval: {
        id: string;
        approved?: never;
        reason?: never;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'approval-responded';
      input: asUITool<TOOL>['input'];
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval: {
        id: string;
        approved: boolean;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'output-available';
      input: asUITool<TOOL>['input'];
      output: asUITool<TOOL>['output'];
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      resultProviderMetadata?: ProviderMetadata;
      preliminary?: boolean;
      approval?: {
        id: string;
        approved: true;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'output-error'; // TODO AI SDK 6：更改为“错误”状态
      input: asUITool<TOOL>['input'] | undefined;
      rawInput?: unknown; // TODO AI SDK 6：删除此字段，输入应该是未知的
      output?: never;
      errorText: string;
      callProviderMetadata?: ProviderMetadata;
      resultProviderMetadata?: ProviderMetadata;
      approval?: {
        id: string;
        approved: true;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'output-denied';
      input: asUITool<TOOL>['input'];
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval: {
        id: string;
        approved: false;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
);

export type ToolUIPart<TOOLS extends UITools = UITools> = ValueOf<{
  [NAME in keyof TOOLS & string]: {
    type: `tool-${NAME}`;
  } & UIToolInvocation<TOOLS[NAME]>;
}>;

export type DynamicToolUIPart = {
  type: 'dynamic-tool';

  /**
   * 正在调用的工具的名称。
   */
  toolName: string;

  /**
   * 工具调用的 ID。
   */
  toolCallId: string;
  title?: string;
  toolMetadata?: JSONObject;

  /**
   * 工具调用是否由提供者执行。
   */
  providerExecuted?: boolean;
} & (
  | {
      state: 'input-streaming';
      input: unknown | undefined;
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval?: never;
    }
  | {
      state: 'input-available';
      input: unknown;
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval?: never;
    }
  | {
      state: 'approval-requested';
      input: unknown;
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval: {
        id: string;
        approved?: never;
        reason?: never;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'approval-responded';
      input: unknown;
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval: {
        id: string;
        approved: boolean;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'output-available';
      input: unknown;
      output: unknown;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      resultProviderMetadata?: ProviderMetadata;
      preliminary?: boolean;
      approval?: {
        id: string;
        approved: true;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'output-error'; // TODO AI SDK 6：更改为“错误”状态
      input: unknown;
      output?: never;
      errorText: string;
      callProviderMetadata?: ProviderMetadata;
      resultProviderMetadata?: ProviderMetadata;
      approval?: {
        id: string;
        approved: true;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
  | {
      state: 'output-denied';
      input: unknown;
      output?: never;
      errorText?: never;
      callProviderMetadata?: ProviderMetadata;
      approval: {
        id: string;
        approved: false;
        reason?: string;
        isAutomatic?: boolean;
      };
    }
);

/**
 * 输入guard 来检查消息部分是否是文本部分。
 */
export function isTextUIPart(
  part: UIMessagePart<UIDataTypes, UITools>,
): part is TextUIPart {
  return part.type === 'text';
}

/**
 * 键入guard 以检查消息部分是否是自定义部分。
 */
export function isCustomContentUIPart(
  part: UIMessagePart<UIDataTypes, UITools>,
): part is CustomContentUIPart {
  return part.type === 'custom';
}

/**
 * 输入guard 来检查消息部分是否是文件部分。
 */
export function isFileUIPart(
  part: UIMessagePart<UIDataTypes, UITools>,
): part is FileUIPart {
  return part.type === 'file';
}

/**
 * 键入guard 以检查消息部分是否是推理文件部分。
 */
export function isReasoningFileUIPart(
  part: UIMessagePart<UIDataTypes, UITools>,
): part is ReasoningFileUIPart {
  return part.type === 'reasoning-file';
}

/**
 * 输入guard 来检查消息部分是否是推理部分。
 */
export function isReasoningUIPart(
  part: UIMessagePart<UIDataTypes, UITools>,
): part is ReasoningUIPart {
  return part.type === 'reasoning';
}

/**
 * 检查消息部分是否是静态工具部分。
 *
 * 静态工具是在开发时类型已知的工具。
 */
export function isStaticToolUIPart<TOOLS extends UITools>(
  part: UIMessagePart<UIDataTypes, TOOLS>,
): part is ToolUIPart<TOOLS> {
  return part.type.startsWith('tool-');
}

/**
 * 检查消息部件是否是动态工具部件。
 *
 * 动态工具是输入和输出类型未知的工具。
 */
export function isDynamicToolUIPart(
  part: UIMessagePart<UIDataTypes, UITools>,
): part is DynamicToolUIPart {
  return part.type === 'dynamic-tool';
}

/**
 * 检查消息部分是否是工具部分。
 *
 * 工具部件可以是静态工具，也可以是动态工具。
 *
 * 使用“isStaticToolUIPart”或“isDynamicToolUIPart”检查工具的类型。
 */
export function isToolUIPart<TOOLS extends UITools>(
  part: UIMessagePart<UIDataTypes, TOOLS>,
): part is ToolUIPart<TOOLS> | DynamicToolUIPart {
  return isStaticToolUIPart(part) || isDynamicToolUIPart(part);
}

/**
 * 返回静态工具的名称。
 *
 * 可能的值是工具集的键。
 */
export function getStaticToolName<TOOLS extends UITools>(
  part: ToolUIPart<TOOLS>,
): keyof TOOLS {
  return part.type.split('-').slice(1).join('-') as keyof TOOLS;
}

/**
 * 返回工具的名称（静态或动态）。
 *
 * 此功能不会将名称限制为工具集的按键。
 * 如果您需要将名称限制为工具集的键，请改用“getStaticToolName”。
 */
export function getToolName(
  part: ToolUIPart<UITools> | DynamicToolUIPart,
): string {
  return isDynamicToolUIPart(part) ? part.toolName : getStaticToolName(part);
}

/**
 * @deprecated 请改用 getToolName。
 */
export const getToolOrDynamicToolName = getToolName;

export type InferUIMessageMetadata<T extends UIMessage> =
  T extends UIMessage<infer METADATA> ? METADATA : unknown;

export type InferUIMessageData<T extends UIMessage> =
  T extends UIMessage<unknown, infer DATA_TYPES> ? DATA_TYPES : UIDataTypes;

export type InferUIMessageTools<T extends UIMessage> =
  T extends UIMessage<unknown, UIDataTypes, infer TOOLS> ? TOOLS : UITools;

export type InferUIMessageToolOutputs<UI_MESSAGE extends UIMessage> =
  InferUIMessageTools<UI_MESSAGE>[keyof InferUIMessageTools<UI_MESSAGE>]['output'];

export type InferUIMessageToolCall<UI_MESSAGE extends UIMessage> =
  | ValueOf<{
      [NAME in keyof InferUIMessageTools<UI_MESSAGE>]: ToolCall<
        NAME & string,
        InferUIMessageTools<UI_MESSAGE>[NAME] extends { input: infer INPUT }
          ? INPUT
          : never
      > & { dynamic?: false };
    }>
  | (ToolCall<string, unknown> & { dynamic: true });

export type InferUIMessagePart<UI_MESSAGE extends UIMessage> = UIMessagePart<
  InferUIMessageData<UI_MESSAGE>,
  InferUIMessageTools<UI_MESSAGE>
>;
