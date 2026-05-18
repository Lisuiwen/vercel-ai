import { InvalidPromptError } from '@ai-sdk/provider';
import {
  asArray,
  safeValidateTypes,
  type ModelMessage,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';
import { modelMessageSchema } from './message';
import type { Instructions, Prompt } from './prompt';

export type StandardizedPrompt = {
  /**
   * 指示。
   */
  instructions: Instructions | undefined;

  /**
   * 消息。
   */
  messages: ModelMessage[];
};

/**
 * 将提示输入转换为具有经过验证的模型的标准化提示
 * 消息。
 *
 * @param prompt - The prompt definition to standardize.
 * 将“allowSystemInMessages”设置为 true 以允许系统消息
 * “提示”或“消息”字段。 “说明”中的系统消息
 * 选项始终是允许的。
 * @returns The standardized prompt.
 * @throws {InvalidPromptError} When the prompt is invalid.
 */
export async function standardizePrompt({
  allowSystemInMessages = false,
  system,
  instructions = system,
  prompt,
  messages,
}: Prompt): Promise<StandardizedPrompt> {
  if (prompt == null && messages == null) {
    throw new InvalidPromptError({
      prompt,
      message: 'prompt or messages must be defined',
    });
  }

  if (prompt != null && messages != null) {
    throw new InvalidPromptError({
      prompt,
      message: 'prompt and messages cannot be defined at the same time',
    });
  }

  // 验证指令是字符串还是 SystemModelMessage
  if (
    typeof instructions !== 'string' &&
    !asArray(instructions).every(message => message.role === 'system')
  ) {
    throw new InvalidPromptError({
      prompt,
      message:
        'instructions must be a string, SystemModelMessage, or array of SystemModelMessage',
    });
  }

  if (prompt != null && typeof prompt === 'string') {
    messages = [{ role: 'user', content: prompt }];
  } else if (prompt != null && Array.isArray(prompt)) {
    messages = prompt;
  } else if (messages == null) {
    throw new InvalidPromptError({
      prompt,
      message: 'prompt or messages must be defined',
    });
  }

  if (messages.length === 0) {
    throw new InvalidPromptError({
      prompt,
      message: 'messages must not be empty',
    });
  }

  if (
    !allowSystemInMessages &&
    messages.some(message => message.role === 'system')
  ) {
    throw new InvalidPromptError({
      prompt,
      message:
        'System messages are not allowed in the prompt or messages fields. Use the instructions option instead.',
    });
  }

  const validationResult = await safeValidateTypes({
    value: messages,
    schema: z.array(modelMessageSchema),
  });

  if (!validationResult.success) {
    throw new InvalidPromptError({
      prompt,
      message: 'The messages do not match the ModelMessage[] schema.',
      cause: validationResult.error,
    });
  }

  return { messages, instructions };
}
