import { describe, expectTypeOf, it } from 'vitest';
import type {
  CustomContentUIPart,
  DataUIPart,
  DynamicToolUIPart,
  FileUIPart,
  ReasoningFileUIPart,
  ReasoningUIPart,
  SourceDocumentUIPart,
  SourceUrlUIPart,
  StepStartUIPart,
  TextUIPart,
  UIMessage,
} from '../ui/ui-messages';
import { ToolLoopAgent } from './tool-loop-agent';
import type { InferAgentUIMessage } from './infer-agent-ui-message';

describe('InferAgentUIMessage', () => {
  it('should not contain arbitrary static tools when no tools are provided', () => {
    const agent = new ToolLoopAgent({
      model: 'openai/gpt-4o',
      // 没有工具
    });

    type Message = InferAgentUIMessage<typeof agent>;

    expectTypeOf<Message>().toMatchTypeOf<UIMessage<unknown, never, {}>>();

    type MessagePart = Message['parts'][number];

    expectTypeOf<MessagePart>().toMatchTypeOf<
      | TextUIPart
      | CustomContentUIPart
      | ReasoningUIPart
      // 没有静态工具，因此没有 ToolUIPart
      | DynamicToolUIPart
      | SourceUrlUIPart
      | SourceDocumentUIPart
      | FileUIPart
      | ReasoningFileUIPart
      | DataUIPart<never>
      | StepStartUIPart
    >();
  });

  it('should include metadata when provided', () => {
    const agent = new ToolLoopAgent({
      model: 'openai/gpt-4o',
      // 没有工具
    });

    type Message = InferAgentUIMessage<typeof agent, { foo: string }>;

    expectTypeOf<Message>().toMatchTypeOf<
      UIMessage<{ foo: string }, never, {}>
    >();
  });
});
