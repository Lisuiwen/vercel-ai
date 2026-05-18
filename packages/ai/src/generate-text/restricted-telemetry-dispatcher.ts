import type {
  Context,
  InferToolContext,
  InferToolSetContext,
  ToolSet,
} from '@ai-sdk/provider-utils';
import { createTelemetryDispatcher } from '../telemetry/create-telemetry-dispatcher';
import type { TelemetryDispatcher } from '../telemetry/telemetry';
import type {
  IncludedContext,
  IncludedToolsContext,
  TelemetryOptions,
} from '../telemetry/telemetry-options';
import type {
  GenerateTextOnFinishCallback,
  GenerateTextOnStartCallback,
  GenerateTextOnStepFinishCallback,
  GenerateTextOnStepStartCallback,
} from './generate-text-events';
import type { Output } from './output';
import { DefaultStepResult, type StepResult } from './step-result';
import type {
  OnToolExecutionEndCallback,
  OnToolExecutionStartCallback,
} from './tool-execution-events';

/**
 * 用于生成文本的遥测调度程序，并带有键入的回调
 * 特定于操作的工具集、运行时上下文和输出形状。
 */
export type RestrictedTelemetryDispatcher<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
  OUTPUT extends Output,
> = Omit<
  TelemetryDispatcher,
  | 'onStart'
  | 'onStepStart'
  | 'onStepFinish'
  | 'onEnd'
  | 'onToolExecutionStart'
  | 'onToolExecutionEnd'
> & {
  onStart: GenerateTextOnStartCallback<TOOLS, RUNTIME_CONTEXT, OUTPUT>;
  onStepStart: GenerateTextOnStepStartCallback<TOOLS, RUNTIME_CONTEXT, OUTPUT>;
  onStepFinish: GenerateTextOnStepFinishCallback<TOOLS, RUNTIME_CONTEXT>;
  onEnd: GenerateTextOnFinishCallback<TOOLS, RUNTIME_CONTEXT>;
  onToolExecutionStart?: OnToolExecutionStartCallback<TOOLS>;
  onToolExecutionEnd?: OnToolExecutionEndCallback<TOOLS>;
};

/**
 * 返回仅包含顶层的运行时上下文的浅表副本
 * 标记为遥测包含的属性。
 */
function filterIncludedContext<CONTEXT extends Context>({
  context,
  includeContext,
}: {
  context: CONTEXT;
  includeContext: IncludedContext<CONTEXT>;
}): Context {
  if (context == null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(context).filter(
      ([key]) => includeContext?.[key as keyof CONTEXT] === true,
    ),
  );
}

/**
 * 创建步骤结果的副本，其运行时上下文仅包含
 * 标记为遥测包含的顶级属性。
 */
function restrictStepResult<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
>({
  step,
  includeRuntimeContext,
  includeToolsContext,
}: {
  step: StepResult<TOOLS, RUNTIME_CONTEXT>;
  includeRuntimeContext: IncludedContext<RUNTIME_CONTEXT>;
  includeToolsContext: IncludedToolsContext<TOOLS>;
}) {
  return new DefaultStepResult({
    callId: step.callId,
    stepNumber: step.stepNumber,
    provider: step.model.provider,
    modelId: step.model.modelId,
    runtimeContext: filterIncludedContext({
      context: step.runtimeContext,
      includeContext: includeRuntimeContext,
    }),
    toolsContext: filterToolsContext({
      toolsContext: step.toolsContext,
      includeToolsContext,
    }),
    content: step.content,
    finishReason: step.finishReason,
    rawFinishReason: step.rawFinishReason,
    usage: step.usage,
    performance: step.performance,
    warnings: step.warnings,
    request: step.request,
    response: step.response,
    providerMetadata: step.providerMetadata,
  });
}

/**
 * 返回仅包含顶级属性的工具上下文的浅表副本
 * 标记为每个工具的遥测包含。
 */
function filterToolsContext<TOOLS extends ToolSet>({
  toolsContext,
  includeToolsContext,
}: {
  toolsContext: InferToolSetContext<TOOLS>;
  includeToolsContext: IncludedToolsContext<TOOLS>;
}): InferToolSetContext<TOOLS> {
  if (includeToolsContext == null) {
    return {} as InferToolSetContext<TOOLS>;
  }

  return Object.fromEntries(
    Object.entries(toolsContext).map(([toolName, toolContext]) => [
      toolName,
      filterToolContext({
        toolName,
        toolContext,
        includeToolsContext,
      }),
    ]),
  ) as InferToolSetContext<TOOLS>;
}

function filterToolContext<TOOLS extends ToolSet>({
  toolName,
  toolContext,
  includeToolsContext,
}: {
  toolName: string;
  toolContext: unknown;
  includeToolsContext: IncludedToolsContext<TOOLS>;
}) {
  const includeToolContext = (
    includeToolsContext as
      | Record<
          string,
          IncludedContext<InferToolContext<TOOLS[typeof toolName]>>
        >
      | undefined
  )?.[toolName];

  return filterIncludedContext({
    context: toolContext as InferToolContext<TOOLS[typeof toolName]>,
    includeContext: includeToolContext,
  });
}

/**
 * 创建仅包含配置的运行时上下文的遥测调度程序
 * 文本生成生命周期事件中的属性，然后再分派它们。
 */
export function createRestrictedTelemetryDispatcher<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context,
  OUTPUT extends Output,
>({
  telemetry,
  includeRuntimeContext,
  includeToolsContext,
}: {
  telemetry?: TelemetryOptions<RUNTIME_CONTEXT, TOOLS>;
  includeRuntimeContext: IncludedContext<RUNTIME_CONTEXT>;
  includeToolsContext?: IncludedToolsContext<TOOLS>;
}): RestrictedTelemetryDispatcher<TOOLS, RUNTIME_CONTEXT, OUTPUT> {
  const telemetryDispatcher = createTelemetryDispatcher({ telemetry });

  return {
    ...telemetryDispatcher,
    onStart: event =>
      telemetryDispatcher.onStart?.({
        ...event,
        runtimeContext: filterIncludedContext({
          context: event.runtimeContext,
          includeContext: includeRuntimeContext,
        }),
        toolsContext: filterToolsContext({
          toolsContext: event.toolsContext,
          includeToolsContext,
        }),
      }),
    onStepStart: event =>
      telemetryDispatcher.onStepStart?.({
        ...event,
        runtimeContext: filterIncludedContext({
          context: event.runtimeContext,
          includeContext: includeRuntimeContext,
        }),
        steps: event.steps.map(step =>
          restrictStepResult({
            step,
            includeRuntimeContext,
            includeToolsContext,
          }),
        ),
        toolsContext: filterToolsContext({
          toolsContext: event.toolsContext,
          includeToolsContext,
        }),
      }),
    onStepFinish: event =>
      telemetryDispatcher.onStepFinish?.(
        restrictStepResult({
          step: event,
          includeRuntimeContext,
          includeToolsContext,
        }),
      ),
    onEnd: event =>
      telemetryDispatcher.onEnd?.({
        ...event,
        runtimeContext: filterIncludedContext({
          context: event.runtimeContext,
          includeContext: includeRuntimeContext,
        }),
        steps: event.steps.map(step =>
          restrictStepResult({
            step,
            includeRuntimeContext,
            includeToolsContext,
          }),
        ),
        toolsContext: filterToolsContext({
          toolsContext: event.toolsContext,
          includeToolsContext,
        }),
      }),
    onToolExecutionStart: event =>
      telemetryDispatcher.onToolExecutionStart?.({
        ...event,
        toolContext: filterToolContext({
          toolName: event.toolCall.toolName,
          toolContext: event.toolContext,
          includeToolsContext,
        }),
      }),
    onToolExecutionEnd: event =>
      telemetryDispatcher.onToolExecutionEnd?.({
        ...event,
        toolContext: filterToolContext({
          toolName: event.toolCall.toolName,
          toolContext: event.toolContext,
          includeToolsContext,
        }),
      }),
  };
}
