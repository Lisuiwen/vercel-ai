import type { ToolSet } from '@ai-sdk/provider-utils';

/**
 * API调用的超时配置。可以指定为：
 * - 代表毫秒的数字
 * - 具有`totalMs`属性的对象，用于表示总超时（以毫秒为单位）
 * - 具有`stepMs`属性的对象，用于表示步骤每个的超时时间（以毫秒为单位）
 * - 具有`chunkMs`属性的对象，用于流块之间的超时（仅限流）
 * - 具有`toolMs`属性的对象，用于所有执行工具的默认超时
 * - 具有`tools`属性的对象，用于使用`{toolName}Ms`键覆盖每个工具的超时
 */
export type TimeoutConfiguration<TOOLS extends ToolSet> =
  | number
  | {
      totalMs?: number;
      stepMs?: number;
      chunkMs?: number;
      toolMs?: number;
      tools?: Partial<Record<`${keyof TOOLS & string}Ms`, number>>;
    };

/**
 * 从TimeoutConfiguration中提取总超时值（以毫秒为单位）。
 *
 * @param timeout - 超时配置。
 * @returns 总超时时间（以毫秒为单位），如果未配置超时则未定义。
 */
export function getTotalTimeoutMs(
  timeout: TimeoutConfiguration<any> | undefined,
): number | undefined {
  if (timeout == null) {
    return undefined;
  }
  if (typeof timeout === 'number') {
    return timeout;
  }
  return timeout.totalMs;
}

/**
 * 从TimeoutConfiguration中提取步骤超时值（以毫秒为单位）。
 *
 * @param timeout - 超时配置。
 * @returns 步骤超时（以毫秒为单位），如果未配置步骤超时，则未定义。
 */
export function getStepTimeoutMs(
  timeout: TimeoutConfiguration<any> | undefined,
): number | undefined {
  if (timeout == null || typeof timeout === 'number') {
    return undefined;
  }
  return timeout.stepMs;
}

/**
 * 从TimeoutConfiguration中提取块超时值（以毫秒为单位）。
 * 此超时仅适用于流式传输 - 如果在指定持续时间内没有收到新块，则会中止。
 *
 * @param timeout - 超时配置。
 * @returns 块超时（以毫秒为单位），如果未配置块超时，则未定义。
 */
export function getChunkTimeoutMs(
  timeout: TimeoutConfiguration<any> | undefined,
): number | undefined {
  if (timeout == null || typeof timeout === 'number') {
    return undefined;
  }
  return timeout.chunkMs;
}

export function getToolTimeoutMs<TOOLS extends ToolSet>(
  timeout: TimeoutConfiguration<TOOLS> | undefined,
  toolName: keyof TOOLS & string,
): number | undefined {
  if (timeout == null || typeof timeout === 'number') {
    return undefined;
  }

  return timeout.tools?.[`${toolName}Ms`] ?? timeout.toolMs;
}

/**
 * 面向请求的控件。这些设置影响传输、重试、
 * 取消、标头和超时 – 不是模型生成行为。
 */
export type RequestOptions<TOOLS extends ToolSet = ToolSet> = {
  /**
   * 最大重试次数。设置为 0 以禁用重试。
   *
   * @default 2
   */
  maxRetries?: number;

  /**
   * 中止信号。
   */
  abortSignal?: AbortSignal;

  /**
   * 与请求一起发送的附加 HTTP 标头。
   * 仅适用于基于 HTTP 的业务。
   */
  headers?: Record<string, string | undefined>;

  /**
   * 请求的超时配置。
   */
  timeout?: TimeoutConfiguration<TOOLS>;
};
