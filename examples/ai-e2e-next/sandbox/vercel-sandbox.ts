import { type Experimental_Sandbox as Sandbox } from 'ai';
import type { Sandbox as VercelSandboxSDK } from '@vercel/sandbox';

const rootDirectory = '/vercel/sandbox';

// Vercel Sandbox 使用 Vercel OIDC token 认证。
//
// 部署在 Vercel 上：
// 1. 在 Vercel 控制台中打开项目。
// 2. 进入 Settings > Security。
// 3. 启用 "Secure backend access with OIDC federation" 并保存。
//
// 本地开发：
// 1. 运行 `vercel link`。
// 2. 运行 `vercel env pull` 将 VERCEL_OIDC_TOKEN 写入 .env.local。
//
// 无 OIDC 时，@vercel/sandbox 会报告缺少 `x-vercel-oidc-token`
// 创建或获取 sandbox 时使用的 header。
export class VercelSandbox implements Sandbox {
  constructor(
    public readonly sandbox: Awaited<
      ReturnType<typeof VercelSandboxSDK.create>
    >,
  ) {}

  async runCommand({
    command,
    workingDirectory,
    abortSignal,
  }: {
    command: string;
    workingDirectory?: string;
    abortSignal?: AbortSignal;
  }) {
    const sandboxCommand = await this.sandbox.runCommand({
      cmd: 'bash',
      args: ['-c', command],
      cwd: workingDirectory ?? rootDirectory,
      detached: true,
    });

    const abortCommand = () => void sandboxCommand.kill('SIGTERM');
    if (abortSignal?.aborted) {
      abortCommand();
    } else {
      abortSignal?.addEventListener('abort', abortCommand, { once: true });
    }

    try {
      const result = await sandboxCommand.wait();

      return {
        exitCode: result.exitCode,
        stdout: await result.stdout(),
        stderr: await result.stderr(),
      };
    } finally {
      abortSignal?.removeEventListener('abort', abortCommand);
    }
  }

  async stop() {
    await this.sandbox.stop();
  }

  get description() {
    return `Vercel Sandbox: ${this.sandbox.sandboxId}\nRoot directory: ${rootDirectory}`;
  }
}
