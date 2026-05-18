import type { LanguageModelV4ToolChoice } from '@ai-sdk/provider';
import type { ToolChoice } from '../types/language-model';

export function prepareToolChoice({
  toolChoice,
}: {
  // 使用any，因为它对于工具选择准备并不重要
  toolChoice: ToolChoice<any> | undefined;
}): LanguageModelV4ToolChoice {
  return toolChoice == null
    ? { type: 'auto' }
    : typeof toolChoice === 'string'
      ? { type: toolChoice }
      : { type: 'tool' as const, toolName: toolChoice.toolName as string };
}
