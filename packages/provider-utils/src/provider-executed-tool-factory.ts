import type { FlexibleSchema } from './schema';
import type { Context } from './types/context';
import { tool, type ProviderExecutedTool, type Tool } from './types/tool';
/**
 * 提供者执行的工具是提供者为其执行工具的工具。
 */
export type ProviderExecutedToolFactory<
  INPUT,
  OUTPUT,
  ARGS extends object,
  CONTEXT extends Context = {},
> = (
  options: ARGS & {
    onInputStart?: Tool<INPUT, OUTPUT, CONTEXT>['onInputStart'];
    onInputDelta?: Tool<INPUT, OUTPUT, CONTEXT>['onInputDelta'];
    onInputAvailable?: Tool<INPUT, OUTPUT, CONTEXT>['onInputAvailable'];
  },
) => ProviderExecutedTool<INPUT, OUTPUT, CONTEXT>;

export function createProviderExecutedToolFactory<
  INPUT,
  OUTPUT,
  ARGS extends object,
  CONTEXT extends Context = {},
>({
  id,
  inputSchema,
  outputSchema,
  supportsDeferredResults,
}: {
  id: `${string}.${string}`;
  inputSchema: FlexibleSchema<INPUT>;
  outputSchema: FlexibleSchema<OUTPUT>;

  /**
   * 此提供商执行的工具是否支持延迟结果。
   *
   * 当 true 时，工具结果可能不会与
   * 工具调用（例如，当使用编程工具调用服务器工具时
   * 触发客户端执行的工具，并且服务器工具的结果被延迟
   * 直到客户端工具解决）。
   *
   * @default false
   */
  supportsDeferredResults?: boolean;
}): ProviderExecutedToolFactory<INPUT, OUTPUT, ARGS, CONTEXT> {
  return ({
    onInputStart,
    onInputDelta,
    onInputAvailable,
    ...args
  }: ARGS & {
    onInputStart?: Tool<INPUT, OUTPUT, CONTEXT>['onInputStart'];
    onInputDelta?: Tool<INPUT, OUTPUT, CONTEXT>['onInputDelta'];
    onInputAvailable?: Tool<INPUT, OUTPUT, CONTEXT>['onInputAvailable'];
  }): ProviderExecutedTool<INPUT, OUTPUT, CONTEXT> =>
    tool({
      type: 'provider',
      isProviderExecuted: true,
      id,
      args,
      inputSchema,
      outputSchema,
      onInputStart,
      onInputDelta,
      onInputAvailable,
      supportsDeferredResults,
    }) as ProviderExecutedTool<INPUT, OUTPUT, CONTEXT>;
}
