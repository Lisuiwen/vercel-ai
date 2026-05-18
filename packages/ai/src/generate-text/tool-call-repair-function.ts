import type { JSONSchema7, LanguageModelV4ToolCall } from '@ai-sdk/provider';
import type { InvalidToolInputError } from '../error/invalid-tool-input-error';
import type { NoSuchToolError } from '../error/no-such-tool-error';
import type { Instructions, ModelMessage } from '../prompt';
import type { ToolSet } from '@ai-sdk/provider-utils';

/**
 * 尝试修复无法解析的工具调用的函数。
 *
 * 它接收错误和上下文作为参数并返回修复
 * 工具将 JSON 作为文本调用。
 *
 * @param options.instructions - 提供给模型的说明。
 * @param options.system - 提供给模型的说明。
 * @param options.messages - 当前生成步骤中的消息。
 * @param options.toolCall - 解析失败的工具调用。
 * @param options.tools - 可用的工具。
 * @param options.inputSchema - 返回工具的 JSON 架构的函数。
 * @param options.error - 解析工具调用时发生的错误。
 */
export type ToolCallRepairFunction<TOOLS extends ToolSet> = (options: {
  instructions: Instructions | undefined;
  /**
   * @deprecated 请改用`说明`。
   */
  system: Instructions | undefined;
  messages: ModelMessage[];
  toolCall: LanguageModelV4ToolCall;
  tools: TOOLS;
  inputSchema: (options: { toolName: string }) => PromiseLike<JSONSchema7>;
  error: NoSuchToolError | InvalidToolInputError;
}) => Promise<LanguageModelV4ToolCall | null>;
