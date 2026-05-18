import type {
  Arrayable,
  Context,
  InferToolSetContext,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { Telemetry } from './telemetry';

export type IncludedContext<CONTEXT extends Context | unknown | never> =
  | { [KEY in keyof NoInfer<CONTEXT>]?: boolean }
  | undefined;

export type IncludedToolsContext<TOOLS extends ToolSet> =
  | {
      [TOOL_NAME in keyof NoInfer<
        InferToolSetContext<TOOLS>
      >]?: IncludedContext<NoInfer<InferToolSetContext<TOOLS>[TOOL_NAME]>>;
    }
  | undefined;

/**
 * 遥测配置。
 */
export type TelemetryOptions<
  RUNTIME_CONTEXT extends Context = Context,
  TOOLS extends ToolSet = ToolSet,
> = {
  /**
   * 启用或禁用遥测。遥测时默认启用
   * 集成已注册。设置为“false”以选择退出。
   */
  isEnabled?: boolean;

  /**
   * 启用或禁用输入记录。默认启用。
   *
   * 您可能想要禁用输入录制以避免录制敏感内容
   * 信息，以减少数据传输或提高性能。
   */
  recordInputs?: boolean;

  /**
   * 启用或禁用输出记录。默认启用。
   *
   * 您可能想要禁用输出录制以避免录制敏感内容
   * 信息，以减少数据传输或提高性能。
   */
  recordOutputs?: boolean;

  /**
   * 该函数的标识符。用于按功能对遥测数据进行分组。
   */
  functionId?: string;

  /**
   * 应包含在遥测中的顶级运行时上下文属性。
   * 除非显式设置为“true”，否则运行时上下文属性将被排除。
   */
  includeRuntimeContext?: IncludedContext<RUNTIME_CONTEXT>;

  /**
   * 应包含在遥测中的顶级工具上下文属性，
   * 每个工具配置。
   *
   * 工具上下文属性被排除，除非它们明确设置为“true”。
   */
  includeToolsContext?: IncludedToolsContext<TOOLS>;

  /**
   * 在生成期间接收生命周期事件的每次调用遥测集成。
   *
   * 一旦提供，这些集成将优先于全球注册的集成
   * 此调用的集成。
   */
  integrations?: Arrayable<Telemetry>;
};
