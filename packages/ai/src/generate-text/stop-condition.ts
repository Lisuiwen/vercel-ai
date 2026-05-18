import type { Context, ToolSet } from '@ai-sdk/provider-utils';
import type { StepResult } from './step-result';

/**
 * 决定工具调用循环是否应在
 * 当前步骤。
 *
 * 工具调用循环将继续进行，直到满足以下条件之一：
 * - 模型返回除“工具调用”之外的完成原因
 * - 调用没有执行函数的工具
 * - 工具调用需要批准
 * - 提供的停止条件之一返回“true”
 */
export type StopCondition<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
> = (options: {
  steps: Array<StepResult<TOOLS, RUNTIME_CONTEXT>>;
}) => PromiseLike<boolean> | boolean;

/**
 * 创建一个停止条件，当完成的数量达到时返回“true”
 * 步骤等于“stepCount”。
 *
 * @param stepCount - The number of steps to allow before stopping.
 */
export function isStepCount(stepCount: number): StopCondition<any, any> {
  return ({ steps }) => steps.length === stepCount;
}

/**
 * 创建一个永远不会返回“true”的停止条件。
 *
 * 这使得工具调用循环继续，直到到达其之一
 * 自然终止条件。
 */
export function isLoopFinished(): StopCondition<any, any> {
  return () => false;
}

/**
 * 创建一个停止条件，在最近的步骤时返回“true”
 * 包含具有任何指定名称的工具调用。
 *
 * @param toolName - The names of the tools that should stop the loop.
 */
export function hasToolCall<TOOLS extends ToolSet>(
  ...toolName: Array<keyof TOOLS | (string & {})> // 对工具名称的自动完成支持
): StopCondition<TOOLS, any> {
  return ({ steps }) =>
    steps[steps.length - 1]?.toolCalls?.some(toolCall =>
      toolName.includes(toolCall.toolName),
    ) ?? false;
}

/**
 * 评估当前步骤列表提供的停止条件。
 *
 * 一旦满足任何停止条件就返回“true”。
 *
 * @param stopConditions - The stop conditions to evaluate.
 * @param steps - The completed steps accumulated so far.
 */
export async function isStopConditionMet<
  TOOLS extends ToolSet,
  RUNTIME_CONTEXT extends Context = Context,
>({
  stopConditions,
  steps,
}: {
  stopConditions: Array<StopCondition<TOOLS, RUNTIME_CONTEXT>>;
  steps: Array<StepResult<TOOLS, RUNTIME_CONTEXT>>;
}): Promise<boolean> {
  return (
    await Promise.all(stopConditions.map(condition => condition({ steps })))
  ).some(result => result);
}
