import type { LanguageModelV4Prompt } from '@ai-sdk/provider';
import type { ModelMessage, ProviderOptions } from '@ai-sdk/provider-utils';
import type { Instructions } from '../prompt';
import type {
  CallWarning,
  FinishReason,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata,
  ProviderMetadata,
} from '../types';
import type { LanguageModelUsage } from '../types/usage';

/**
 * 事件传递给`experimental_onStart`回调
 * `generateObject` 和 `streamObject`。
 *
 * 在操作开始时、任何LLM调用之前调用。
 *
 * @已弃用
 */
export interface GenerateObjectStartEvent {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 操作标识类型（例如`ai.generateObject`或`ai.streamObject`）。 */
  readonly operationId: string;

  /* * 提供者标识符（例如`openai`、`anthropic`）。 */
  readonly provider: string;

  /* * 特定型号标识符（例如`gpt-4o`）。 */
  readonly modelId: string;

  /* * 提供给模型的系统消息。 */
  readonly system: Instructions | undefined;

  /* * 如果使用提示选项，则为提示字符串或消息数组。 */
  readonly prompt: string | Array<ModelMessage> | undefined;

  /* * 如果使用消息选项，则为消息数组。 */
  readonly messages: Array<ModelMessage> | undefined;

  /* * 生成的最大代币数量。 */
  readonly maxOutputTokens: number | undefined;
  /* * 生成的采样温度。 */
  readonly temperature: number | undefined;
  /* * Top-p（核）采样参数。 */
  readonly topP: number | undefined;
  /* * Top-k采样参数。 */
  readonly topK: number | undefined;
  /* * 生成的存在惩罚。 */
  readonly presencePenalty: number | undefined;
  /* * 发电频率损失。 */
  readonly frequencyPenalty: number | undefined;
  /* * 可重复生成的随机种子。 */
  readonly seed: number | undefined;
  /* * 失败请求的最大重试次数。 */
  readonly maxRetries: number;

  /* * 随请求一起发送的附加 HTTP 标头。 */
  readonly headers: Record<string, string | undefined> | undefined;

  /* * 其他特定于提供商的选项。 */
  readonly providerOptions: ProviderOptions | undefined;

  /* * 输出策略类型。 */
  readonly output: 'object' | 'array' | 'enum' | 'no-schema';

  /* * 用于生成对象的JSON模式（如果有）。 */
  readonly schema: Record<string, unknown> | undefined;

  /* * 模式的可选名称。 */
  readonly schemaName: string | undefined;

  /* * 模式的可选描述。 */
  readonly schemaDescription: string | undefined;
}

/**
 * 事件提交给`experimental_onStepStart`回调
 * `generateObject` 和 `streamObject`。
 *
 * 在模型调用（步骤）开始时、调用提供程序之前调用。
 * 对于对象生成，总是只有一个步骤（步骤 0）。
 *
 * @已弃用
 */
export interface GenerateObjectStepStartEvent {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 当前步骤的从零开始的索引。对于对象生成始终为“0”。 */
  readonly stepNumber: 0;

  /* * 提供者标识符（例如`openai`、`anthropic`）。 */
  readonly provider: string;

  /* * 特定型号标识符（例如`gpt-4o`）。 */
  readonly modelId: string;

  /* * 其他特定于提供商的选项。 */
  readonly providerOptions: ProviderOptions | undefined;

  /* * 随请求一起发送的附加 HTTP 标头。 */
  readonly headers: Record<string, string | undefined> | undefined;

  /* * 提供者格式的提示消息（用于遥测）。 */
  readonly promptMessages?: LanguageModelV4Prompt;
}

/**
 * 事件提交给`onStepFinish`回调
 * `generateObject` 和 `streamObject`。
 *
 * 当模型调用（步骤）完成时调用，并带有原始结果
 * 在JSON解析和模式验证之前。
 *
 * @已弃用
 */
export interface GenerateObjectStepEndEvent {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 当前步骤的从零开始的索引。对于对象生成始终为“0”。 */
  readonly stepNumber: 0;

  /* * 提供者标识符（例如`openai`、`anthropic`）。 */
  readonly provider: string;

  /* * 特定型号标识符（例如`gpt-4o`）。 */
  readonly modelId: string;

  /* * 生成结束的统一原因。 */
  readonly finishReason: FinishReason;

  /* * 生成的响应的令牌使用情况。 */
  readonly usage: LanguageModelUsage;

  /* * 模型的原始文本输出（JSON解析）。 */
  readonly objectText: string;

  /* * 模型生成的推理（如果有）。 */
  readonly reasoning: string | undefined;

  /* * 来自模型提供商的警告（例如不支持的设置）。 */
  readonly warnings: CallWarning[] | undefined;

  /* * 附加请求信息。 */
  readonly request: Omit<LanguageModelRequestMetadata, 'messages'>;

  /* * 附加响应信息。 */
  readonly response: Omit<LanguageModelResponseMetadata, 'messages'>;

  /* * 额外的特定于提供商的元数据。 */
  readonly providerMetadata: ProviderMetadata | undefined;

  /* * 从流开始到第一个块的毫秒数（仅限流）。 */
  readonly msToFirstChunk: number | undefined;
}

/**
 * 事件提交给`onFinish`回调
 * `generateObject` 和 `streamObject`。
 *
 * 整个操作完成时调用，包括JSON解析
 * 和模式验证。对于`streamObject`，该对象可能是未定义的
 * 如果验证失败（在这种情况下会提供错误）。
 *
 * @已弃用
 */
export interface GenerateObjectEndEvent<RESULT> {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /**
   * 生成的对象（根据模式键入）。
   * 始终为`generateObject`定义。对于`streamObject`可能是`未定义`
   * 当解析或验证失败时。
   */
  readonly object: RESULT | undefined;

  /**
   * 解析或模式验证错误（如果有）。
   * `generateObject`始终为`undefined`（它会抛出异常）。
   */
  readonly error: unknown | undefined;

  /* * 模型生成的推理（如果有）。 */
  readonly reasoning: string | undefined;

  /* * 生成结束的统一原因。 */
  readonly finishReason: FinishReason;

  /* * 生成的响应的令牌使用情况。 */
  readonly usage: LanguageModelUsage;

  /* * 来自模型提供商的警告（例如不支持的设置）。 */
  readonly warnings: CallWarning[] | undefined;

  /* * 附加请求信息。 */
  readonly request: Omit<LanguageModelRequestMetadata, 'messages'>;

  /* * 附加响应信息。 */
  readonly response: Omit<LanguageModelResponseMetadata, 'messages'>;

  /* * 额外的特定于提供商的元数据。 */
  readonly providerMetadata: ProviderMetadata | undefined;
}
