import type { IdGenerator } from '@ai-sdk/provider-utils';
import type { UIMessage } from '../ui/ui-messages';

/**
 * 确定用于响应消息的消息 ID。
 * 如果最后一条消息是辅助消息，则重复使用其 ID（继续）。
 * 否则，将生成新的 ID 或使用提供的 ID。
 *
 * @param options.originalMessages - The original messages. If not provided, returns `undefined`
 *   因为客户端 ID 生成是在非持久模式下使用的。
 * @param options.responseMessageId - The response message ID or an ID generator function.
 *
 * @returns The message ID to use, or `undefined` if no persistence mode.
 */
export function getResponseUIMessageId({
  originalMessages,
  responseMessageId,
}: {
  originalMessages: UIMessage[] | undefined;
  responseMessageId: string | IdGenerator;
}) {
  // 当没有原始消息时（即没有持久性），
  // 助理消息 ID 的生成在客户端处理。
  if (originalMessages == null) {
    return undefined;
  }

  const lastMessage = originalMessages[originalMessages.length - 1];

  return lastMessage?.role === 'assistant'
    ? lastMessage.id
    : typeof responseMessageId === 'function'
      ? responseMessageId()
      : responseMessageId;
}
