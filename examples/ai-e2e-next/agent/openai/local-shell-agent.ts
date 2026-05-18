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

export const openaiLocalShellAgent = new ToolLoopAgent({
  model: openai('gpt-5-codex'),
  instructions:
    'You are an agent with access to a shell environment.' +
    'When a command execution is denied, ask the user if they want to execute something else.',
  tools: {
    shell: openai.tools.localShell({
      needsApproval({ action }) {
        // 仅允许无需审批即可执行 `ls`
        return action.command.join(' ') !== 'ls';
      },
      async execute({ action }) {
        const [cmd, ...args] = action.command;

        const sandbox = await getSandbox();
        const command = await sandbox.runCommand({
          cmd,
          args,
          cwd: action.workingDirectory,
        });

        return { output: await command.stdout() };
      },
    }),
  },
});

export type OpenAILocalShellMessage = InferAgentUIMessage<
  typeof openaiLocalShellAgent
>;
