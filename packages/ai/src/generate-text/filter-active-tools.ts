import type { ToolSet } from '@ai-sdk/provider-utils';
import type { ActiveTools } from './active-tools';

export type ActiveToolSubset<
  TOOLS extends ToolSet | undefined,
  ACTIVE_TOOL_NAMES extends ActiveTools<NonNullable<TOOLS>>,
> = TOOLS extends undefined
  ? undefined
  : [ACTIVE_TOOL_NAMES] extends [NonNullable<ActiveTools<NonNullable<TOOLS>>>]
    ? Pick<NonNullable<TOOLS>, ACTIVE_TOOL_NAMES[number]>
    : TOOLS;

/**
 * 过滤工具以仅包含活动工具。
 * 当提供 activeTools 时，我们只包含列表中的工具。
 *
 * @param tools - 过滤的工具。
 * @param activeTools - 要包含的活动工具。
 * @returns 过滤后的工具。
 */
export function filterActiveTools<
  TOOLS extends ToolSet | undefined,
  ACTIVE_TOOL_NAMES extends ActiveTools<NonNullable<TOOLS>>,
>({
  tools,
  activeTools,
}: {
  tools: TOOLS;
  activeTools: ACTIVE_TOOL_NAMES;
}): ActiveToolSubset<TOOLS, ACTIVE_TOOL_NAMES> {
  if (tools == null || activeTools == null) {
    return tools as ActiveToolSubset<TOOLS, ACTIVE_TOOL_NAMES>;
  }

  return Object.fromEntries(
    Object.entries(tools).filter(([name]) => activeTools.includes(name)),
  ) as ActiveToolSubset<TOOLS, ACTIVE_TOOL_NAMES>;
}
