import { openai } from '@ai-sdk/openai';
import { Sandbox } from '@vercel/sandbox';
import { ToolLoopAgent, type InferAgentUIMessage } from 'ai';
// 警告：这是 localhost 上跨聊天共享的演示 sandbox
let globalSandboxId: string | null = null;
async function getSandbox(): Promise<Sandbox> {
  if (globalSandboxId) {
    return await Sandbox.get({ sandboxId: globalSandboxId });
  }
  const sandbox = await Sandbox.create();
  globalSandboxId = sandbox.sandboxId;
  return sandbox;
}

async function executeShellCommand(
  command: string,
  timeoutMs?: number,
): Promise<{
  stdout: string;
  stderr: string;
  outcome: { type: 'timeout' } | { type: 'exit'; exitCode: number };
}> {
  const sandbox = await getSandbox();
  const timeout = timeoutMs ?? 60_000; // 默认 60 秒

  try {
    // 使用 Promise.race 处理超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Command timeout')), timeout);
    });

    const commandPromise = sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', command],
    });

    const commandResult = await Promise.race([commandPromise, timeoutPromise]);

    const stdout = await commandResult.stdout();
    const stderr = await commandResult.stderr();
    const exitCode = commandResult.exitCode ?? 0;

    return {
      stdout: stdout || '',
      stderr: stderr || '',
      outcome: { type: 'exit', exitCode },
    };
  } catch (error: any) {
    // 处理超时或其他错误
    const timedOut = error?.message?.includes('timeout') || false;
    const exitCode = timedOut ? null : (error?.code ?? 1);

    return {
      stdout: error?.stdout ?? '',
      stderr: error?.stderr ?? String(error),
      outcome: timedOut
        ? { type: 'timeout' }
        : { type: 'exit', exitCode: exitCode ?? 1 },
    };
  }
}

export const openaiShellAgent = new ToolLoopAgent({
  model: openai.responses('gpt-5.1'),
  instructions:
    'You have access to a shell tool that can execute commands on the local filesystem. ' +
    'Use the shell tool when you need to perform file operations or run commands. ' +
    'When a tool execution is not approved by the user, do not retry it. ' +
    'Just say that the tool execution was not approved.',
  tools: {
    shell: openai.tools.shell({
      needsApproval: true,
      async execute({ action }) {
        const outputs = await Promise.all(
          action.commands.map(command =>
            executeShellCommand(command, action.timeoutMs),
          ),
        );

        return { output: outputs };
      },
    }),
  },
});

export type OpenAIShellMessage = InferAgentUIMessage<typeof openaiShellAgent>;
