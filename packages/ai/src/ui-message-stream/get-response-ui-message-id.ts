import type { IdGenerator } from '@ai-sdk/provider-utils';
import type { UIMessage } from '../ui/ui-messages';

/**
 * 确定用于响应消息的消息ID。
 * 如果最后一条消息是辅助消息，则重复使用其ID（继续）。
 * 否则，将生成新的 ID 或使用提供的 ID。
 *
 * @param options.originalMessages - 原始消息。如果未提供，则返回`未定义`
 * 因为客户端ID生成是在非持久模式下使用的。
 * @param options.responseMessageId - 响应消息 ID 或 ID 生成器函数。
 *
 * @returns 要使用的消息 ID，如果没有持久模式，则为`未定义`。
 */
export function getResponseUIMessageId({
  originalMessages,
  responseMessageId,
}: {
  originalMessages: UIMessage[] | undefined;
  responseMessageId: string | IdGenerator;
}) {
  // 当没有原始消息时（即没有持久性），
  // 助理消息ID在客户端处理时生成。
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
