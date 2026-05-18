import { tool } from 'ai';
import { z } from 'zod';

export function sandboxShellTool() {
  return tool({
    description: 'Run a shell command',
    inputSchema: z.object({
      command: z.string(),
      workingDirectory: z.string().optional(),
    }),

    execute: async (
      { command, workingDirectory },
      { abortSignal, experimental_sandbox: sandbox },
    ) => {
      // TODO 找出类型推断以将运行时错误转变为类型错误
      if (!sandbox) {
        throw new Error('Sandbox is not available');
      }
      return sandbox.runCommand({
        command,
        workingDirectory,
        abortSignal,
      });
    },
  });
}
