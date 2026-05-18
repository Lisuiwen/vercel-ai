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
 * @param options.instructions - The instructions provided to the model.
 * @param options.system - The instructions provided to the model.
 * @param options.messages - The messages in the current generation step.
 * @param options.toolCall - The tool call that failed to parse.
 * @param options.tools - The tools that are available.
 * @param options.inputSchema - A function that returns the JSON Schema for a tool.
 * @param options.error - The error that occurred while parsing the tool call.
 */
export type ToolCallRepairFunction<TOOLS extends ToolSet> = (options: {
  instructions: Instructions | undefined;
  /**
   * @deprecated 请改用“说明”。
   */
  system: Instructions | undefined;
  messages: ModelMessage[];
  toolCall: LanguageModelV4ToolCall;
  tools: TOOLS;
  inputSchema: (options: { toolName: string }) => PromiseLike<JSONSchema7>;
  error: NoSuchToolError | InvalidToolInputError;
}) => Promise<LanguageModelV4ToolCall | null>;
