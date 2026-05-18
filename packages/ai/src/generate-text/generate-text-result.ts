import type { Context, ToolSet } from '@ai-sdk/provider-utils';
import type {
  CallWarning,
  FinishReason,
  LanguageModelResponseMetadata,
  ProviderMetadata,
} from '../types';
import type { Source } from '../types/language-model';
import type { LanguageModelUsage } from '../types/usage';
import type { ContentPart } from './content-part';
import type { GeneratedFile } from './generated-file';
import type { Output } from './output';
import type { InferCompleteOutput } from './output-utils';
import type { ReasoningFileOutput, ReasoningOutput } from './reasoning-output';
import type { ResponseMessage } from './response-message';
import type { StepResult } from './step-result';
import type {
  DynamicToolCall,
  StaticToolCall,
  TypedToolCall,
} from './tool-call';
import type {
  DynamicToolResult,
  StaticToolResult,
  TypedToolResult,
} from './tool-result';

/**
 * `generateText` 调用的结果。
 * 它包含生成的文本、生成期间进行的工具调用以及工具调用的结果。
 */
export interface GenerateTextResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
  OUTPUT extends Output,
> {
  /**
   * 所有步骤中生成的内容。
   */
  readonly content: Array<ContentPart<TOOLS>>;

  /**
   * 在最后一步中生成的文本。
   */
  readonly text: string;

  /**
   * 模型在最后一步中生成的完整推理。
   *
   * @deprecated 请改用`finalStep.reasoning`。
   */
  readonly reasoning: Array<ReasoningOutput | ReasoningFileOutput>;

  /**
   * 模型在上一步中生成的推理文本。如果模型可以是未定义的
   * 仅生成文本。
   *
   * @deprecated 请改用`finalStep.reasoningText`。
   */
  readonly reasoningText: string | undefined;

  /**
   * 所有步骤中生成的文件。
   * 如果没有生成文件，则为空数组。
   */
  readonly files: Array<GeneratedFile>;

  /**
   * 在所有步骤中用作参考的来源。
   */
  readonly sources: Array<Source>;

  /**
   * 所有步骤中进行的工具调用。
   */
  readonly toolCalls: Array<TypedToolCall<TOOLS>>;

  /**
   * 所有步骤中进行的静态工具调用。
   */
  readonly staticToolCalls: Array<StaticToolCall<TOOLS>>;

  /**
   * 所有步骤中进行的动态工具调用。
   */
  readonly dynamicToolCalls: Array<DynamicToolCall>;

  /**
   * 该工具从所有步骤调用的结果。
   */
  readonly toolResults: Array<TypedToolResult<TOOLS>>;

  /**
   * 所有步骤中生成的静态工具结果。
   */
  readonly staticToolResults: Array<StaticToolResult<TOOLS>>;

  /**
   * 所有步骤中生成的动态工具结果。
   */
  readonly dynamicToolResults: Array<DynamicToolResult>;

  /**
   * 一代结束的统一原因。
   */
  readonly finishReason: FinishReason;

  /**
   * 生成完成的原始原因（来自提供者）。
   */
  readonly rawFinishReason: string | undefined;

  /**
   * 所有步骤的总令牌使用量。
   * 当有多个步骤时，使用量为所有步骤使用量的总和。
   */
  readonly usage: LanguageModelUsage;

  /**
   * 所有步骤的总令牌使用量。
   * 当有多个步骤时，使用量为所有步骤使用量的总和。
   *
   * @deprecated 请改用`最合适`。
   */
  readonly totalUsage: LanguageModelUsage;

  /**
   * 所有步骤中均来自模型提供者的警告（例如不支持的设置）。
   */
  readonly warnings: CallWarning[] | undefined;

  /**
   * 上一步中的附加请求信息。
   *
   * @deprecated 请改用`finalStep.request`。
   */
  readonly request: StepResult<TOOLS, RUNTIME_CONTEXT>['request'];

  /**
   * 最后一步的附加响应信息。
   *
   * @deprecated 请改用`finalStep.response`。
   */
  readonly response: LanguageModelResponseMetadata;

  /**
   * 调用期间生成的所有步骤的累积响应消息。
   */
  readonly responseMessages: Array<ResponseMessage>;

  /**
   * 最后一步中的其他特定于提供商的元数据。他们通过了
   * 从成功到AI SDK并实现成功特定的
   * 可以完全封装在提供者中的结果。
   *
   * @deprecated 请改用`finalStep.providerMetadata`。
   */
  readonly providerMetadata: ProviderMetadata | undefined;

  /**
   * 所有步骤的详细信息。
   * 您可以使用它来获取有关中间步骤的信息，
   * 例如工具调用或响应标头。
   */
  readonly steps: Array<StepResult<TOOLS, RUNTIME_CONTEXT>>;

  /**
   * 最后一步。这是`steps.at(-1)`的快捷方式。
   */
  readonly finalStep: StepResult<TOOLS, RUNTIME_CONTEXT>;

  /**
   * 生成的结构化输出。它使用“输出”规范。
   *
   */
  readonly output: InferCompleteOutput<OUTPUT>;
}
