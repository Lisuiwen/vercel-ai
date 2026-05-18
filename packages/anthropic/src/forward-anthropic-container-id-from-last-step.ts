import type { JSONObject } from '@ai-sdk/provider';
import type { AnthropicMessageMetadata } from './anthropic-message-metadata';

/**
 * 根据提供者选项设置 Anthropic 容器 ID
 * 任何先前步骤的提供者元数据。
 *
 * 通过步骤向后搜索以查找最新的容器 ID。
 * 您可以在`prepareStep`中使用此函数在步骤之间转发容器ID。
 */
export function forwardAnthropicContainerIdFromLastStep({
  steps,
}: {
  steps: Array<{
    providerMetadata?: Record<string, JSONObject>;
  }>;
}): undefined | { providerOptions?: Record<string, JSONObject> } {
  // 通过步骤向后搜索以找到最新的容器 ID
  for (let i = steps.length - 1; i >= 0; i--) {
    const containerId = (
      steps[i].providerMetadata?.anthropic as
        | AnthropicMessageMetadata
        | undefined
    )?.container?.id;

    if (containerId) {
      return {
        providerOptions: {
          anthropic: {
            container: { id: containerId },
          },
        },
      };
    }
  }

  return undefined;
}
