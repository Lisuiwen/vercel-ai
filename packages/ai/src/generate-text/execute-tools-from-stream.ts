import type {
  Arrayable,
  Context,
  IdGenerator,
  InferToolSetContext,
  ModelMessage,
  Experimental_Sandbox as Sandbox,
  ToolSet,
} from '@ai-sdk/provider-utils';
import type { TimeoutConfiguration } from '../prompt/request-options';
import type { Telemetry } from '../telemetry/telemetry';
import { executeToolCall } from './execute-tool-call';
import { resolveToolApproval } from './resolve-tool-approval';
import type { LanguageModelStreamPart } from './stream-language-model-call';
import type { ToolApprovalConfiguration } from './tool-approval-configuration';
import type { TypedToolCall } from './tool-call';
import type {
  OnToolExecutionEndCallback,
  OnToolExecutionStartCallback,
} from './tool-execution-events';

export type ToolExecutionEndStreamPart = {
  type: 'tool-execution-end';
  toolCallId: string;
  toolExecutionMs: number;
};

export type ExecuteToolsStreamPart<TOOLS extends ToolSet = ToolSet> =
  | LanguageModelStreamPart<TOOLS>
  | ToolExecutionEndStreamPart;

export function executeToolsFromStream<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context | unknown | never,
>({
  stream,
  tools,
  callId,
  messages,
  abortSignal,
  timeout,
  experimental_sandbox: sandbox,
  toolsContext,
  toolApproval,
  runtimeContext,
  generateId,
  onToolExecutionStart,
  onToolExecutionEnd,
  executeToolInTelemetryContext,
}: {
  stream: ReadableStream<LanguageModelStreamPart<TOOLS>>;
  tools: TOOLS | undefined;
  callId: string;
  messages: ModelMessage[];
  abortSignal: AbortSignal | undefined;
  timeout?: TimeoutConfiguration<TOOLS>;
  experimental_sandbox?: Sandbox;
  toolsContext: InferToolSetContext<TOOLS>;
  toolApproval?: ToolApprovalConfiguration<TOOLS, RUNTIME_CONTEXT>;
  runtimeContext: RUNTIME_CONTEXT;
  generateId: IdGenerator;
  onToolExecutionStart?: Arrayable<OnToolExecutionStartCallback<TOOLS>>;
  onToolExecutionEnd?: Arrayable<OnToolExecutionEndCallback<TOOLS>>;
  executeToolInTelemetryContext?: Telemetry['executeTool'];
}): ReadableStream<ExecuteToolsStreamPart<TOOLS>> {
  const toolCallsToExecute: Array<TypedToolCall<TOOLS>> = [];

  // 转发流
  return stream.pipeThrough(
    new TransformStream<
      LanguageModelStreamPart<TOOLS>,
      ExecuteToolsStreamPart<TOOLS>
    >({
      async transform(
        chunk: LanguageModelStreamPart<TOOLS>,
        controller: TransformStreamDefaultController<
          ExecuteToolsStreamPart<TOOLS>
        >,
      ) {
        // 立即转发所有块
        controller.enqueue(chunk);

        const chunkType = chunk.type;

        switch (chunkType) {
          case 'tool-call': {
            if (chunk.invalid) {
              return;
            }

            const tool = tools?.[chunk.toolName];

            if (tool == null) {
              // 忽略对不可用工具的工具调用，
              // 例如提供商执行的动态工具
              return;
            }

            const toolApprovalStatus = await resolveToolApproval({
              tools,
              toolCall: chunk,
              toolApproval,
              messages,
              toolsContext,
              runtimeContext,
            });

            switch (toolApprovalStatus.type) {
              case 'user-approval': {
                controller.enqueue({
                  type: 'tool-approval-request',
                  approvalId: generateId(),
                  toolCall: chunk,
                });

                return; // 不执行工具
              }

              case 'denied': {
                const approvalId = generateId();

                controller.enqueue({
                  type: 'tool-approval-request',
                  approvalId,
                  toolCall: chunk,
                  isAutomatic: true,
                });
                controller.enqueue({
                  type: 'tool-approval-response',
                  approvalId,
                  approved: false,
                  toolCall: chunk,
                  reason: toolApprovalStatus.reason,
                  providerExecuted: chunk.providerExecuted,
                });

                return; // 不执行工具
              }

              case 'approved': {
                const approvalId = generateId();

                controller.enqueue({
                  type: 'tool-approval-request',
                  approvalId,
                  toolCall: chunk,
                  isAutomatic: true,
                });
                controller.enqueue({
                  type: 'tool-approval-response',
                  approvalId,
                  approved: true,
                  toolCall: chunk,
                  reason: toolApprovalStatus.reason,
                  providerExecuted: chunk.providerExecuted,
                });

                break; // 继续执行工具
              }

              case 'not-applicable':
                break; // 继续执行工具
            }

            // 仅执行非提供者执行的工具：
            if (tool.execute != null && chunk.providerExecuted !== true) {
              toolCallsToExecute.push(chunk);
            }

            return;
          }

          case 'model-call-end': {
            await Promise.all(
              toolCallsToExecute.map(async toolCall => {
                try {
                  // 注意：我们不在这里等待工具执行（通过在 recordSpan 上省略“await”），
                  // 因为我们想尽快处理下一个块。
                  // 这对于工具执行时间较长的情况很重要。
                  const result = await executeToolCall({
                    toolCall,
                    tools,
                    callId,
                    messages,
                    abortSignal,
                    timeout,
                    experimental_sandbox: sandbox,
                    toolsContext,
                    onToolExecutionStart,
                    onToolExecutionEnd,
                    executeToolInTelemetryContext,
                    onPreliminaryToolResult: result => {
                      controller.enqueue(result);
                    },
                  });
                  if (result != null) {
                    controller.enqueue({
                      type: 'tool-execution-end',
                      toolCallId: result.output.toolCallId,
                      toolExecutionMs: result.toolExecutionMs,
                    });
                    controller.enqueue(result.output);
                  }
                } catch (error) {
                  controller.enqueue({
                    type: 'error',
                    error,
                  });
                }
              }),
            );

            return;
          }
        }
      },
    }),
  );
}
