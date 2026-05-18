import type {
  Context,
  Experimental_Sandbox as Sandbox,
  InferToolSetContext,
  ModelMessage,
  ProviderOptions,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { Instructions } from '../prompt';
import type { LanguageModel, ToolChoice } from '../types/language-model';
import type { ActiveTools } from './active-tools';
import type { ResponseMessage } from './response-message';
import type { StepResult } from './step-result';

/**
 * 可用于为步骤提供不同设置的函数。
 *
 * @param options - 该步骤的选项。
 * @param options.steps - 到目前为止已执行的步骤。
 * @param options.stepNumber - 正在执行的步骤的编号。
 * @param options.model - 正在使用的模型。
 * @param options.instructions - 将发送到当前步骤的模型的指令。
 * @param options.initialInstructions - 传递到generateText或streamText的初始指令。
 * @param options.messages - 将发送到当前步骤的模型的消息。如果您返回`messages`覆盖，这些消息将继续执行后续步骤。
 * @param options.initialMessages - 传递到generateText或streamText的初始消息。
 * @param options.responseMessages - 从前面的步骤中累积的响应消息。
 * @param options.runtimeContext - 用户定义的运行时上下文。
 *
 * @returns 包含步骤设置的对象。
 * 如果返回未定义（或未定义的设置），则将使用外层的设置。
 */
export type PrepareStepFunction<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = (options: {
  /**
   * 到目前为止已执行的步骤。
   */
  steps: Array<StepResult<NoInfer<TOOLS>, NoInfer<RUNTIME_CONTEXT>>>;

  /**
   * 正在执行的步骤的编号。
   */
  stepNumber: number;

  /**
   * 用于此步骤的模型实例。
   */
  model: LanguageModel;

  /**
   * 将发送到当前步骤的模型的指令。
   */
  instructions: Instructions | undefined;

  /**
   * 传递到generateText或streamText的初始指令。
   */
  initialInstructions: Instructions | undefined;

  /**
   * 将发送到当前步骤的模型的消息。
   * 如果您返回`消息`覆盖，这些消息将继续执行后续步骤。
   */
  messages: Array<ModelMessage>;

  /**
   * 传递到generateText或streamText的初始消息。
   */
  initialMessages: Array<ModelMessage>;

  /**
   * 从之前所有步骤中累积的响应消息。
   */
  responseMessages: Array<ResponseMessage>;

  /**
   * 工具上下文。
   */
  toolsContext: InferToolSetContext<TOOLS>;

  /**
   * 用户定义的运行时上下文。
   */
  runtimeContext: RUNTIME_CONTEXT;

  /**
   * 该步骤运行所在的沙箱环境。
   */
  experimental_sandbox?: Sandbox;
}) =>
  | PromiseLike<PrepareStepResult<TOOLS, RUNTIME_CONTEXT>>
  | PrepareStepResult<TOOLS, RUNTIME_CONTEXT>;

/**
 * {@linkPrepareStepFunction}返回的结果类型，
 * 允许按步骤覆盖模型、工具、指令或消息。
 */
export type PrepareStepResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> =
  | {
      /**
       * （可选）使用 LanguageModel 实例覆盖此步骤。
       */
      model?: LanguageModel;

      /**
       * 可选择设置模型必须调用哪个工具，或提供工具调用配置
       * 对于这一步。
       */
      toolChoice?: ToolChoice<NoInfer<TOOLS>>;

      /**
       * 如果提供，则此步骤仅启用/可用这些工具。
       */
      activeTools?: ActiveTools<NoInfer<TOOLS>>;

      /**
       * （可选）覆盖发送到模型的此步骤的指令。
       * 覆盖将继续到后续步骤。
       */
      instructions?: Instructions;

      /**
       * （可选）覆盖发送到模型的此步骤的指令。
       *
       * @deprecated 请改用`说明`。
       */
      system?: Instructions;

      /**
       * 可以选择覆盖发送到模型的全套消息
       * 对于这一步。覆盖将继续到后续步骤。
       */
      messages?: Array<ModelMessage>;

      /**
       * 工具上下文。
       *
       * 改变toolsContext会影响这一步的toolsContext
       * 以及所有后续步骤。
       *
       * toolsContext 被传递到工具执行中。
       */
      toolsContext?: InferToolSetContext<TOOLS>;

      /**
       * 运行时上下文。
       *
       * 改变runtimeContext会影响这一步的runtimeContext
       * 以及所有后续步骤。
       */
      runtimeContext?: RUNTIME_CONTEXT;

      /**
       * 该步骤运行所在的沙箱环境。
       *
       * 更改沙箱只会影响此步骤中的工具执行。
       */
      experimental_sandbox?: Sandbox;

      /**
       * 此步骤的其他特定于提供商的选项。
       *
       * 可用于传递特定于提供者的配置，例如
       * 人类代码执行的容器ID。
       */
      providerOptions?: ProviderOptions;
    }
  | undefined;
