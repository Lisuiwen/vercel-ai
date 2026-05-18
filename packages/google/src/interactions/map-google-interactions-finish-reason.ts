import type { LanguageModelV4FinishReason } from '@ai-sdk/provider';
import type { GoogleInteractionsStatus } from './google-interactions-prompt';

/*
 * 当响应包含客户端函数时选择“工具调用”
 * 打电话。 API 本身通过“require_action”发出信号，但是
 * 实践中也会出现“completed + hasFunctionCall”。
 */
export function mapGoogleInteractionsFinishReason({
  status,
  hasFunctionCall,
}: {
  status: GoogleInteractionsStatus | string | null | undefined;
  hasFunctionCall: boolean;
}): LanguageModelV4FinishReason['unified'] {
  switch (status) {
    case 'completed':
      return hasFunctionCall ? 'tool-calls' : 'stop';
    case 'requires_action':
      return 'tool-calls';
    case 'failed':
      return 'error';
    case 'incomplete':
      return 'length';
    case 'cancelled':
      return 'other';
    case 'in_progress':
    default:
      return 'other';
  }
}
