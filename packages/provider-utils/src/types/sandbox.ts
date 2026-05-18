/**
 * 可以执行命令的沙箱环境。
 */
export type Experimental_Sandbox = {
  /**
   * 可以添加到代理指令中的沙盒环境描述
   * 以便代理了解相关详细信息，例如暴露的根目录
   * 端口、公共主机名等。
   */
  readonly description: string;

  /**
   * 在沙箱中运行命令。
   */
  readonly runCommand: (options: {
    /**
     * 在沙箱中执行的命令。
     */
    command: string;

    /**
     * 执行命令的工作目录。
     */
    workingDirectory?: string;

    /**
     * 可用于中止命令的信号。
     */
    abortSignal?: AbortSignal;
  }) => PromiseLike<{
    /**
     * 命令返回的退出代码。
     */
    exitCode: number;

    /**
     * 命令生成的标准输出。
     */
    stdout: string;

    /**
     * 命令产生的标准错误。
     */
    stderr: string;
  }>;
};
