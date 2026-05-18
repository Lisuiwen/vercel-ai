import type { InferUITools, UIMessage } from '../ui/ui-messages';
import type { InferAgentTools } from './infer-agent-tools';

/**
 * 推断代理的UI消息类型。
 */
export type InferAgentUIMessage<AGENT, MESSAGE_METADATA = unknown> = UIMessage<
  MESSAGE_METADATA,
  never,
  InferUITools<InferAgentTools<AGENT>>
>;
