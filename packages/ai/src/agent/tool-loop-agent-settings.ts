import type {
  Arrayable,
  Context,
  FlexibleSchema,
  IdGenerator,
  InferToolSetContext,
  MaybePromiseLike,
  ProviderOptions,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { ActiveTools } from '../generate-text/active-tools';
import type {
  GenerateTextOnFinishCallback,
  GenerateTextOnStartCallback,
  GenerateTextOnStepFinishCallback,
  GenerateTextOnStepStartCallback,
} from '../generate-text/generate-text-events';
import type { GenerateTextInclude } from '../generate-text/generate-text';
import type { Output } from '../generate-text/output';
import type { PrepareStepFunction } from '../generate-text/prepare-step';
import type { StopCondition } from '../generate-text/stop-condition';
import type { StreamTextInclude } from '../generate-text/stream-text';
import type { ToolApprovalConfiguration } from '../generate-text/tool-approval-configuration';
import type { ToolCallRepairFunction } from '../generate-text/tool-call-repair-function';
import type {
  OnToolExecutionEndCallback,
  OnToolExecutionStartCallback,
} from '../generate-text/tool-execution-events';
import type { ToolInputRefinement } from '../generate-text/tool-input-refinement';
import type { ToolsContextParameter } from '../generate-text/tools-context-parameter';
import type { LanguageModelCallOptions } from '../prompt/language-model-call-options';
import type { Instructions, Prompt } from '../prompt/prompt';
import type { RequestOptions } from '../prompt/request-options';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import type { LanguageModel, ToolChoice } from '../types/language-model';
import type { DownloadFunction } from '../util/download/download-function';
import type { AgentCallParameters } from './agent';

/**
 * 代理的配置选项。
 */
export type ToolLoopAgentSettings<
  CALL_OPTIONS = never,
  TOOLS extends ToolSet = {},
  RUNTIME_CONTEXT extends Context = Context,
  OUTPUT extends Output = never,
> = LanguageModelCallOptions &
  Omit<RequestOptions<TOOLS>, 'abortSignal'> &
  ToolsContextParameter<TOOLS> & {
    /**
     * 代理的ID。
     */
    id?: string;

    /**
     * 给代理的说明。
     *
     * 它可以是一个字符串，或者，如果您需要提供其他提供程序选项（例如用于服务器），则可以是`SystemModelMessage`。
     */
    instructions?: Instructions;

    /**
     * 要使用的语言模型。
     */
    model: LanguageModel;

    /**
     * 工具选择策略。默认值：“自动”。
     */
    toolChoice?: ToolChoice<NoInfer<TOOLS>>;

    /**
     * 最后一步有工具结果时停止生成的条件。
     * 当条件是数组时，满足任何一个条件都可以停止生成。
     *
     * @default isStepCount(20)
     */
    stopWhen?: Arrayable<StopCondition<NoInfer<TOOLS>, RUNTIME_CONTEXT>>;

    /**
     * 可选遥测配置。
     */
    telemetry?: TelemetryOptions<RUNTIME_CONTEXT, NoInfer<TOOLS>>;

    /**
     * 可选遥测配置。
     *
     * @deprecated 请改用`遥测`。该别名将在未来的主要版本中删除。
     */
    experimental_telemetry?: TelemetryOptions<RUNTIME_CONTEXT, NoInfer<TOOLS>>;

    /**
     * 限制模型可以调用的工具，无需
     * 更改结果中的工具调用和结果类型。
     */
    activeTools?: ActiveTools<NoInfer<TOOLS>>;

    /**
     * 用于生成结构化输出的可选规范。
     */
    output?: OUTPUT;

    /**
     * 运行时上下文。将运行时上下文视为不可变。
     * 如果您需要改变运行时上下文，请在`prepareStep`中更新它。
     */
    runtimeContext?: RUNTIME_CONTEXT;

    /**
     * 可选工具审批配置。
     *
     * 此配置优先于工具定义的批准设置。
     */
    toolApproval?: ToolApprovalConfiguration<NoInfer<TOOLS>, RUNTIME_CONTEXT>;

    /**
     * 您可以使用可选函数为步骤提供不同的设置。
     */
    prepareStep?: PrepareStepFunction<NoInfer<TOOLS>, RUNTIME_CONTEXT>;

    /**
     * 尝试修复无法解析的工具调用的函数。
     */
    experimental_repairToolCall?: ToolCallRepairFunction<NoInfer<TOOLS>>;

    /**
     * 工具名称到优化已解析工具输入的函数的可选映射。
     *
     * 精炼输入必须与工具输入具有相同的类型形状。精致
     * 输入用于工具执行、输出、回调和遥测。
     */
    experimental_refineToolInput?: ToolInputRefinement<NoInfer<TOOLS>>;

    /**
     * 代理操作开始时、任何LLM调用之前调用的回调。
     */
    experimental_onStart?: GenerateTextOnStartCallback<
      NoInfer<TOOLS>,
      RUNTIME_CONTEXT,
      NoInfer<OUTPUT>
    >;

    /**
     * 在调用提供程序之前，步骤（LLM调用）开始时调用的回调。
     */
    experimental_onStepStart?: GenerateTextOnStepStartCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>,
      NoInfer<OUTPUT>
    >;

    /**
     * 在每个工具执行开始之前调用的回调。
     */
    onToolExecutionStart?: OnToolExecutionStartCallback<NoInfer<TOOLS>>;

    /**
     * 每个工具执行完成后调用的回调。
     */
    onToolExecutionEnd?: OnToolExecutionEndCallback<NoInfer<TOOLS>>;

    /**
     * 每个步骤（LLM调用）完成时调用的回调，包括中间步骤。
     */
    onStepFinish?: GenerateTextOnStepFinishCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>
    >;

    /**
     * 当所有步骤完成并且响应完成时调用的回调。
     */
    onFinish?: GenerateTextOnFinishCallback<
      NoInfer<TOOLS>,
      NoInfer<RUNTIME_CONTEXT>
    >;

    /**
     * 其他特定于提供商的选项。他们通过
     * 从AI SDK发送给成功并实现特定的成功
     * 可以完全封装在提供者中的功能。
     */
    providerOptions?: ProviderOptions;

    /**
     * 使用URL的自定义下载功能。
     *
     * 默认情况下，如果模型不支持给定媒体类型的URL，则下载文件。
     */
    experimental_download?: DownloadFunction | undefined;

    /**
     * 用于控制步骤结果中包含哪些数据的设置。
     * 禁用包含可以帮助减少处理时的内存使用量
     * 图像等大型有效负载。
     *
     * 默认情况下包含请求体和响应体，并且请求
     * 消息被排除。
     */
    include?: GenerateTextInclude & StreamTextInclude;

    /**
     * 内部的。仅供测试使用。可能会更改，恕不另行通知。
     */
    _internal?: {
      generateId?: IdGenerator;
      generateCallId?: IdGenerator;
    };

    /**
     * 看涨期权的架构。
     */
    callOptionsSchema?: FlexibleSchema<CALL_OPTIONS>;

    /**
     * 为generateText 或streamText 调用准备参数。
     *
     * 您可以使用它来创建基于呼叫选项的模板。
     *
     * 该设计要求您传递如下调用参数
     * 允许从原始设置中删除参数
     * 通过将它们设置为“未定义”：
     *
     * ```
     * 准备调用：（{选项，...休息}）=>（{
     *     ...休息，
     *   }),
     * ```
     */
    prepareCall?: (
      options: Omit<
        AgentCallParameters<
          CALL_OPTIONS,
          NoInfer<TOOLS>,
          NoInfer<RUNTIME_CONTEXT>
        >,
        'onStepFinish'
      > &
        Pick<
          ToolLoopAgentSettings<
            CALL_OPTIONS,
            TOOLS,
            RUNTIME_CONTEXT,
            NoInfer<OUTPUT>
          >,
          | 'model'
          | 'tools'
          | 'maxOutputTokens'
          | 'temperature'
          | 'topP'
          | 'topK'
          | 'presencePenalty'
          | 'frequencyPenalty'
          | 'stopSequences'
          | 'seed'
          | 'headers'
          | 'instructions'
          | 'stopWhen'
          | 'telemetry'
          | 'experimental_telemetry'
          | 'activeTools'
          | 'toolApproval'
          | 'providerOptions'
          | 'experimental_download'
          | 'experimental_refineToolInput'
          | 'include'
          | 'runtimeContext'
          | '_internal'
        > & { toolsContext: InferToolSetContext<TOOLS> },
    ) => MaybePromiseLike<
      Pick<
        ToolLoopAgentSettings<
          CALL_OPTIONS,
          TOOLS,
          RUNTIME_CONTEXT,
          NoInfer<OUTPUT>
        >,
        | 'model'
        | 'tools'
        | 'maxOutputTokens'
        | 'temperature'
        | 'topP'
        | 'topK'
        | 'presencePenalty'
        | 'frequencyPenalty'
        | 'stopSequences'
        | 'seed'
        | 'headers'
        | 'instructions'
        | 'stopWhen'
        | 'telemetry'
        | 'experimental_telemetry'
        | 'activeTools'
        | 'toolApproval'
        | 'providerOptions'
        | 'experimental_download'
        | 'experimental_refineToolInput'
        | 'include'
        | 'runtimeContext'
        | '_internal'
      > &
        Omit<Prompt, 'system'> & {
          toolsContext: InferToolSetContext<TOOLS>;
        }
    >;
  };
