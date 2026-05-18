import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { type Experimental_Sandbox as Sandbox } from 'ai';

const execAsync = promisify(exec);

/**
 * 警告：这不是安全沙箱。
 *
 * LocalSandbox 仅设置 shell 命令的工作目录。命令可以
 * still read or edit files outside `rootDirectory` through absolute paths,
 * 父目录路径、符号链接、子进程和 shell 功能。仅使用
 * 这与受信任的命令。
 */
export class LocalSandbox implements Sandbox {
  /**
   * 根目录用作默认工作目录。
   *
   * 警告：这不提供文件系统隔离。
   */
  readonly rootDirectory: string;

  constructor({ rootDirectory }: { rootDirectory: string }) {
    this.rootDirectory = rootDirectory;
  }

  async runCommand({
    command,
    workingDirectory,
    abortSignal,
  }: {
    command: string;
    workingDirectory?: string;
    abortSignal?: AbortSignal;
  }) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDirectory ?? this.rootDirectory,
        timeout: 60_000,
        maxBuffer: 10 * 1024 * 1024,
        signal: abortSignal,
      });

      return {
        exitCode: 0,
        stdout: stdout || '',
        stderr: stderr || '',
      };
    } catch (error: any) {
      return {
        exitCode:
          error?.killed || error?.signal === 'SIGTERM' ? 1 : (error?.code ?? 1),
        stdout: error?.stdout ?? '',
        stderr: error?.stderr ?? String(error),
      };
    }
  }

  get description() {
    return [
      'WARNING: LocalSandbox is not a true sandbox.',
      'Commands can access files outside the root directory.',
      `Root directory: ${this.rootDirectory}`,
    ].join('\n');
  }
}
