import type { JSONValue, JSONObject } from '@ai-sdk/provider';
import type { FlexibleSchema } from '../schema';
import type { ToolResultOutput } from './content-part';
import type { Context } from './context';
import type { NeverOptional } from './never-optional';
import type { ProviderOptions } from './provider-options';
import type {
  ToolExecuteFunction,
  ToolExecutionOptions,
} from './tool-execute-function';
import type { ToolNeedsApprovalFunction } from './tool-needs-approval-function';
import type { Experimental_Sandbox as Sandbox } from './sandbox';

/**
 * 用于确定工具的输出模式和执行函数属性的帮助程序类型。
 */
type ToolOutputProperties<
  INPUT,
  OUTPUT,
  CONTEXT extends Context | unknown | never,
> = NeverOptional<
  OUTPUT,
  | {
      /**
       * 该工具生成的输出的可选架构。
       *
       * 如果未提供，则将从执行函数推断输出形状。
       */
      outputSchema?: FlexibleSchema<OUTPUT>;

      /**
       * 使用工具调用中的参数进行调用并生成结果的异步函数。
       * 如果未提供，该工具将不会自动执行。
       *
       * @args is the input of the tool call.
       * @options.abortSignal is a signal that can be used to abort the tool call.
       */
      execute: ToolExecuteFunction<INPUT, OUTPUT, CONTEXT>;
    }
  | {
      /**
       * 该工具生成的输出的架构。
       *
       * 当没有提供执行函数时需要。
       */
      outputSchema: FlexibleSchema<OUTPUT>;

      execute?: never;
    }
>;

/**
 * 所有工具类型共享的通用属性。
 */
type BaseTool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> = {
  /**
   * 该工具的可选标题。
   *
   * @deprecated 使用“providerMetadata”来获取特定于源的工具显示元数据。
   */
  title?: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从 AI SDK 发送给提供商并启用特定于提供商的
   * 可以完全封装在提供者中的功能。
   */
  providerOptions?: ProviderOptions;

  /**
   * 有关工具本身的可选元数据（例如其来源）。
   *
   * 与“providerOptions”不同，此元数据不会发送到语言
   * 模型。相反，它会传播到生成的工具调用上
   * “toolMetadata”，以便消费者可以从工具调用/结果部分读取它
   * 和 UI 消息部分。这对于动态工具的来源很有用（例如
   * MCP 服务器）来识别自己的身份。
   */
  metadata?: JSONObject;

  /**
   * 工具期望的输入架构。
   * 语言模型将使用它来生成输入。
   * 它还用于验证语言模型的输出。
   *
   * 您可以使用架构属性的描述来使输入易于语言模型理解。
   */
  inputSchema: FlexibleSchema<INPUT>;

  /**
   * 描述工具期望的上下文的可选模式。
   *
   * 上下文作为执行选项的一部分传递给执行函数。
   */
  contextSchema?: FlexibleSchema<CONTEXT>;

  /**
   * 该工具在执行之前是否需要批准。
   *
   * @deprecated 工具批准现在在“generateText”/“streamText”级别上处理。
   */
  needsApproval?:
    | boolean
    | ToolNeedsApprovalFunction<
        [INPUT] extends [never] ? unknown : INPUT,
        NoInfer<CONTEXT>
      >;

  /**
   * 参数流开始时调用的可选函数。
   * 仅当在流上下文中使用该工具时才调用。
   */
  onInputStart?: (
    options: ToolExecutionOptions<NoInfer<CONTEXT>>,
  ) => void | PromiseLike<void>;

  /**
   * 当参数流增量可用时调用的可选函数。
   * 仅当在流上下文中使用该工具时才调用。
   */
  onInputDelta?: (
    options: { inputTextDelta: string } & ToolExecutionOptions<
      NoInfer<CONTEXT>
    >,
  ) => void | PromiseLike<void>;

  /**
   * 可以启动工具调用时调用的可选函数，
   * 即使没有提供执行功能。
   */
  onInputAvailable?: (
    options: {
      input: [INPUT] extends [never] ? unknown : INPUT;
    } & ToolExecutionOptions<NoInfer<CONTEXT>>,
  ) => void | PromiseLike<void>;

  /**
   * 可选的转换函数，将工具结果映射到语言模型可以使用的输出。
   *
   * 如果未提供，工具结果将作为 JSON 对象发送。
   *
   * 此函数由 `convertToModelMessages` 在服务器上调用，因此请确保将相同的“工具”(ToolSet) 传递给“convertToModelMessages”和“streamText”（或其他生成 API）。
   */
  toModelOutput?: (options: {
    /**
     * 工具调用的 ID。您可以使用它，例如当使用流数据发送工具调用相关信息时。
     */
    toolCallId: string;

    /**
     * 工具调用的输入。
     */
    input: [INPUT] extends [never] ? unknown : INPUT;

    /**
     * 工具调用的输出。
     */
    output: 0 extends 1 & OUTPUT
      ? any
      : [OUTPUT] extends [never]
        ? any
        : NoInfer<OUTPUT>;
  }) => ToolResultOutput | PromiseLike<ToolResultOutput>;
} & ToolOutputProperties<INPUT, OUTPUT, NoInfer<CONTEXT>>;

/**
 * 函数式工具共享的公共属性。
 */
type BaseFunctionTool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> = BaseTool<INPUT, OUTPUT, CONTEXT> & {
  /**
   * 该工具功能的可选描述。
   *
   * 包含在发送到语言模型的工具定义中，以便它可以
   * 决定何时以及如何调用该工具。
   *
   * 提供固定描述的字符串，或返回
   * 来自当前“上下文”（和可选的“experimental_sandbox”）的字符串
   * 每次调用的描述应有所不同。
   */
  description?:
    | string
    | ((options: {
        context: NoInfer<CONTEXT>;
        experimental_sandbox?: Sandbox;
      }) => string);

  /**
   * 工具的严格模式设置。
   *
   * 支持严格模式的提供商将使用此设置来确定
   * 如何生成输入。严格模式总会产生
   * 有效的输入，但它可能会限制支持的输入模式。
   */
  strict?: boolean;

  /**
   * 显示语言的输入示例的可选列表
   * 对输入应该是什么样子进行建模。
   */
  inputExamples?: Array<{ input: NoInfer<INPUT> }>;

  // 使所有属性都可用以提高使用率 dx
  id?: never;
  isProviderExecuted?: never;
  args?: never;
  supportsDeferredResults?: never;
};

/**
 * 由 AI SDK 执行的具有用户定义的输入和输出模式的工具。
 */
export type FunctionTool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> = BaseFunctionTool<INPUT, OUTPUT, CONTEXT> & {
  type?: undefined | 'function';
};

/**
 * 在运行时定义的工具。
 * 输入和输出的类型在开发时是未知的。
 *
 * 例如，在开发时未知的 MCP 工具。
 */
export type DynamicTool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> = BaseFunctionTool<INPUT, OUTPUT, CONTEXT> & {
  type: 'dynamic';
};

/**
 * 提供者工具共享的公共属性。
 */
type BaseProviderTool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> = BaseTool<INPUT, OUTPUT, CONTEXT> & {
  type: 'provider';

  /**
   * 工具的 ID。必须遵循格式“<provider-name>.<unique-tool-name>”。
   */
  id: `${string}.${string}`;

  /**
   * 用于配置工具的参数。必须匹配提供者为此工具定义的预期参数。
   */
  args: Record<string, unknown>;

  // 使所有属性都可用以提高使用率 dx
  description?: never;
  strict?: never;
  inputExamples?: never;
};

/**
 * 具有提供者定义的输入和输出模式的工具，由
 * 用户。
 *
 * 例如，在本地 shell 中执行的 shell 工具，但具有提供程序定义的输入和输出架构。
 */
export type ProviderDefinedTool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> = BaseProviderTool<INPUT, OUTPUT, CONTEXT> & {
  /**
   * 指示该工具是否由提供者执行的标志。
   */
  isProviderExecuted: false;

  // 使所有属性都可用以提高使用率 dx
  supportsDeferredResults?: never;
};

/**
 * 具有提供者定义的输入和输出模式的工具，由
 * 提供者。
 *
 * 例如，由提供商本身执行的网络搜索工具和代码执行工具。
 */
export type ProviderExecutedTool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> = BaseProviderTool<INPUT, OUTPUT, CONTEXT> & {
  /**
   * 指示该工具是否由提供者执行的标志。
   */
  isProviderExecuted: true;

  /**
   * 此提供商执行的工具是否支持延迟结果。
   *
   * 当 true 时，工具结果可能不会与
   * 工具调用（例如，当使用编程工具调用服务器工具时
   * 触发客户端执行的工具，并且服务器工具的结果被延迟
   * 直到客户端工具解决）。
   *
   * 该标志允许 AI SDK 处理未经处理而到达的工具结果
   * 当前响应中的匹配工具调用。
   *
   * @default false
   */
  supportsDeferredResults?: boolean;
};

/**
 * 工具可以是用户定义的，也可以是提供商定义的。
 *
 * 它包含语言模型调用所需的模式和元数据
 * 该工具可以包含由以下工具执行的工具的执行函数
 * 人工智能 SDK。
 */
export type Tool<
  INPUT extends JSONValue | unknown | never = any,
  OUTPUT extends JSONValue | unknown | never = any,
  CONTEXT extends Context | unknown | never = any,
> =
  | FunctionTool<INPUT, OUTPUT, CONTEXT>
  | DynamicTool<INPUT, OUTPUT, CONTEXT>
  | ProviderDefinedTool<INPUT, OUTPUT, CONTEXT>
  | ProviderExecutedTool<INPUT, OUTPUT, CONTEXT>;

/**
 * Infer the tool type from a tool object.
 *
 * 这对于使用工具对象时的类型推断很有用。
 */
// 注意：重载顺序对于自动完成很重要
export function tool<INPUT, OUTPUT, CONTEXT extends Context>(
  tool: Tool<INPUT, OUTPUT, CONTEXT>,
): Tool<INPUT, OUTPUT, CONTEXT>;
export function tool<INPUT, CONTEXT extends Context>(
  tool: Tool<INPUT, never, CONTEXT>,
): Tool<INPUT, never, CONTEXT>;
export function tool<OUTPUT, CONTEXT extends Context>(
  tool: Tool<never, OUTPUT, CONTEXT>,
): Tool<never, OUTPUT, CONTEXT>;
export function tool<CONTEXT extends Context>(
  tool: Tool<never, never, CONTEXT>,
): Tool<never, never, CONTEXT>;
export function tool(tool: any): any {
  return tool;
}

/**
 * 定义动态工具。
 */
export function dynamicTool(
  tool: Omit<DynamicTool<unknown, unknown, Context>, 'type'>,
): DynamicTool<unknown, unknown, Context> {
  return { ...tool, type: 'dynamic' } as DynamicTool<unknown, unknown, Context>;
}
