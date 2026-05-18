import { isToolUIPart, type UIMessage } from './ui-messages';
/**
 * 检查最后一条消息是否是已完成工具调用批准的辅助消息。
 * 消息的最后一步必须至少有一个工具批准响应，并且
 * 所有工具批准都必须有响应。
 */
export function lastAssistantMessageIsCompleteWithApprovalResponses({
  messages,
}: {
  messages: UIMessage[];
}): boolean {
  const message = messages[messages.length - 1];

  if (!message) {
    return false;
  }

  if (message.role !== 'assistant') {
    return false;
  }

  const lastStepStartIndex = message.parts.reduce((lastIndex, part, index) => {
    return part.type === 'step-start' ? index : lastIndex;
  }, -1);

  const lastStepToolInvocations = message.parts
    .slice(lastStepStartIndex + 1)
    .filter(isToolUIPart);

  return (
    // 至少有一项工具批准响应
    lastStepToolInvocations.filter(part => part.state === 'approval-responded')
      .length > 0 &&
    // 所有工具批准都必须有响应
    lastStepToolInvocations.every(
      part =>
        part.state === 'output-available' ||
        part.state === 'output-error' ||
        part.state === 'approval-responded',
    )
  );
}
