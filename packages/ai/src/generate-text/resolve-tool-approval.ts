import type {
  Context,
  InferToolInput,
  InferToolSetContext,
  ModelMessage,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type {
  ToolApprovalConfiguration,
  ToolApprovalStatus,
} from './tool-approval-configuration';
import type { TypedToolCall } from './tool-call';
import { validateToolContext } from './validate-tool-context';

/**
 * 通过检查用户提供的和工具定义的来解析工具调用的批准状态
 * 批准设置，并将结果标准化为对象状态形状。
 * 用户定义的批准设置优先于工具定义的设置。
 * 如果未提供批准设置，则工具调用不需要批准。
 */
export async function resolveToolApproval<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context | unknown | never,
>({
  tools,
  toolCall,
  toolApproval,
  messages,
  toolsContext,
  runtimeContext,
}: {
  /**
   * 可供模型调用的工具。
   */
  tools: TOOLS | undefined;

  /**
   * 有效的工具调用。
   */
  toolCall: TypedToolCall<TOOLS>;

  /**
   * 用户定义的工具审批配置。
   *
   * 此配置优先于工具定义的批准设置。
   */
  toolApproval: ToolApprovalConfiguration<TOOLS, RUNTIME_CONTEXT> | undefined;

  /**
   * 发送到语言模型以启动包含工具调用的响应的消息。
   */
  messages: ModelMessage[];

  /**
   * 由工具的上下文架构定义的工具上下文。
   */
  toolsContext: InferToolSetContext<TOOLS>;

  /**
   * 用户定义的运行时上下文（与“generateText”/“streamText”上的“runtimeContext”相同）。
   */
  runtimeContext: RUNTIME_CONTEXT;
}): Promise<Exclude<ToolApprovalStatus, string | undefined>> {
  // 用户定义的通用工具审批
  if (toolApproval != null && typeof toolApproval === 'function') {
    return normalizeToolApprovalStatus(
      await toolApproval({
        toolCall,
        tools,
        toolsContext,
        messages,
        runtimeContext,
      }),
    );
  }

  const toolName = toolCall.toolName;
  const tool = tools?.[toolName];

  // 假设输入已经过验证并且与工具的输入模式匹配
  const input = toolCall.input as InferToolInput<TOOLS[keyof TOOLS]>;

  // 用户定义的每个工具批准
  const userDefinedToolApprovalStatus = toolApproval?.[toolName];
  if (userDefinedToolApprovalStatus != null) {
    const approvalStatus: ToolApprovalStatus | undefined =
      typeof userDefinedToolApprovalStatus === 'function'
        ? await userDefinedToolApprovalStatus(input, {
            toolCallId: toolCall.toolCallId,
            messages,
            toolContext: await validateToolContext({
              toolName,
              context:
                toolsContext?.[toolName as keyof InferToolSetContext<TOOLS>],
              contextSchema: tool?.contextSchema,
            }),
            runtimeContext,
          })
        : userDefinedToolApprovalStatus;

    return normalizeToolApprovalStatus(approvalStatus);
  }

  // 工具定义的批准
  if (tool?.needsApproval == null) {
    return { type: 'not-applicable' };
  }

  const needsApproval =
    typeof tool.needsApproval === 'function'
      ? await tool.needsApproval(input, {
          toolCallId: toolCall.toolCallId,
          messages,
          context: await validateToolContext({
            toolName,
            context:
              toolsContext?.[toolName as keyof InferToolSetContext<TOOLS>],
            contextSchema: tool?.contextSchema,
          }),
        })
      : tool.needsApproval;

  return needsApproval ? { type: 'user-approval' } : { type: 'not-applicable' };
}

function normalizeToolApprovalStatus(
  status: ToolApprovalStatus | undefined,
): Exclude<ToolApprovalStatus, string | undefined> {
  return status === undefined
    ? { type: 'not-applicable' }
    : typeof status === 'string'
      ? { type: status }
      : status;
}
