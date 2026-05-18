import {
  createProviderDefinedToolFactoryWithOutputSchema,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const localShellInputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      action: z.object({
        type: z.literal('exec'),
        command: z.array(z.string()),
        timeoutMs: z.number().optional(),
        user: z.string().optional(),
        workingDirectory: z.string().optional(),
        env: z.record(z.string(), z.string()).optional(),
      }),
    }),
  ),
);

export const localShellOutputSchema = lazySchema(() =>
  zodSchema(z.object({ output: z.string() })),
);

export const localShell = createProviderDefinedToolFactoryWithOutputSchema<
  {
    /**
     * 在服务器上执行 shell 命令。
     */
    action: {
      type: 'exec';

      /**
       * 要运行的命令。
       */
      command: string[];

      /**
       * 命令的可选超时（以毫秒为单位）。
       */
      timeoutMs?: number;

      /**
       * 运行命令的可选用户。
       */
      user?: string;

      /**
       * 用于运行命令的可选工作目录。
       */
      workingDirectory?: string;

      /**
       * 为命令设置的环境变量。
       */
      env?: Record<string, string>;
    };
  },
  {
    /**
     * 本地 shell 工具调用的输出。
     */
    output: string;
  },
  {}
>({
  id: 'openai.local_shell',
  inputSchema: localShellInputSchema,
  outputSchema: localShellOutputSchema,
});
