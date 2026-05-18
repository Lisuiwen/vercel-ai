import {
  createProviderDefinedToolFactory,
  lazySchema,
  type Experimental_Sandbox as Sandbox,
  type ProviderDefinedTool,
  type Tool,
  type ToolExecuteFunction,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

type Bash20241022Input = {
  /**
   * 要运行的 bash 命令。除非重新启动该工具，否则是必需的。
   */
  command: string;

  /**
   * 指定 true 将重新启动该工具。否则，请保留此未指定。
   */
  restart?: boolean;
};

const bash_20241022InputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      command: z.string(),
      restart: z.boolean().optional(),
    }),
  ),
);

export const bash_20241022_internal = createProviderDefinedToolFactory<
  Bash20241022Input,
  {}
>({
  id: 'anthropic.bash_20241022',
  inputSchema: bash_20241022InputSchema,
});

type Bash20241022Options<OUTPUT> = {
  execute?: ToolExecuteFunction<Bash20241022Input, OUTPUT, {}>;
  needsApproval?: Tool<Bash20241022Input, OUTPUT, {}>['needsApproval'];
  toModelOutput?: Tool<Bash20241022Input, OUTPUT, {}>['toModelOutput'];
  onInputStart?: Tool<Bash20241022Input, OUTPUT, {}>['onInputStart'];
  onInputDelta?: Tool<Bash20241022Input, OUTPUT, {}>['onInputDelta'];
  onInputAvailable?: Tool<Bash20241022Input, OUTPUT, {}>['onInputAvailable'];
};

type Bash20241022OptionsWithNullableExecute<OUTPUT> = Omit<
  Bash20241022Options<OUTPUT>,
  'execute'
> & {
  execute?: Bash20241022Options<OUTPUT>['execute'] | null;
};

type Bash20241022DefaultOutput = Awaited<ReturnType<Sandbox['runCommand']>>;

export function bash_20241022(
  options?: Omit<Bash20241022Options<Bash20241022DefaultOutput>, 'execute'> & {
    execute?: undefined;
  },
): ProviderDefinedTool<Bash20241022Input, Bash20241022DefaultOutput, {}>;
export function bash_20241022<OUTPUT = never>(
  options: Omit<Bash20241022Options<OUTPUT>, 'execute'> & {
    execute: null;
  },
): ProviderDefinedTool<Bash20241022Input, OUTPUT, {}>;
export function bash_20241022<OUTPUT>(
  options: Omit<Bash20241022Options<OUTPUT>, 'execute'> & {
    execute: Bash20241022Options<OUTPUT>['execute'];
  },
): ProviderDefinedTool<Bash20241022Input, OUTPUT, {}>;
export function bash_20241022<OUTPUT>(
  options: Bash20241022OptionsWithNullableExecute<OUTPUT> = {},
): ProviderDefinedTool<Bash20241022Input, OUTPUT, {}> {
  const { execute, ...rest } = options;

  if (execute === undefined) {
    return bash_20241022_internal({
      ...rest,
      execute: async (
        { command },
        { abortSignal, experimental_sandbox: sandbox },
      ) => {
        if (!sandbox) {
          throw new Error('Sandbox is not available');
        }

        return await sandbox.runCommand({
          command,
          abortSignal,
        });
      },
    } as Bash20241022Options<Bash20241022DefaultOutput>) as ReturnType<
      typeof bash_20241022_internal<OUTPUT>
    >;
  }

  return bash_20241022_internal({
    ...rest,
    ...(execute === null ? {} : { execute }),
  } as Bash20241022Options<OUTPUT>);
}
