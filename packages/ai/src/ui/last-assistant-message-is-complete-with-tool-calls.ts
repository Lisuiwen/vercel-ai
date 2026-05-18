import { isToolUIPart, type UIMessage } from './ui-messages';
/**
 * 检查最后一条消息是否是已完成工具调用的辅助消息。
 * 消息的最后一步必须至少有一个工具调用，并且
 * 所有工具调用都必须有结果。
 */
export function lastAssistantMessageIsCompleteWithToolCalls({
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
    .filter(isToolUIPart)
    .filter(part => !part.providerExecuted);

  return (
    lastStepToolInvocations.length > 0 &&
    lastStepToolInvocations.every(
      part =>
        part.state === 'output-available' || part.state === 'output-error',
    )
  );
}
