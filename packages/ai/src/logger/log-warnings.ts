import type { Warning } from '../types';

/**
 * 记录警告的功能。
 *
 * 您可以将其分配给“AI_SDK_LOG_WARNINGS”全局变量，以将其用作默认警告记录器。
 *
 * @example
 * ````ts
 * globalThis.AI_SDK_LOG_WARNINGS =（选项）=> {
 *   console.log('警告：', options.warnings, options.provider, options.model);
 * };
 * ```
 */
export type LogWarningsFunction = (options: {
  /**
   * 模型提供者返回的警告。
   */
  warnings: Warning[];

  /**
   * 用于调用的提供者 ID（如果范围仅限于特定提供者）。
   */
  provider?: string;

  /**
   * 用于调用的模型 ID（如果范围仅限于特定提供商）。
   */
  model?: string;
}) => void;

/**
 * 将警告对象格式化为具有清晰 AI SDK 品牌的人类可读字符串。
 *
 * @param options - The options for formatting the warning.
 * @param options.warning - The warning to format.
 * @param options.provider - The provider id used for the call, if scoped to a specific provider.
 * @param options.model - The model id used for the call, if scoped to a specific provider.
 * @returns A formatted warning message string.
 */
function formatWarning({
  warning,
  provider,
  model,
}: {
  warning: Warning;
  provider?: string;
  model?: string;
}): string {
  const scope =
    provider != null && model != null ? ` (${provider} / ${model})` : '';
  const prefix = `AI SDK Warning${scope}:`;

  switch (warning.type) {
    case 'unsupported': {
      let message = `${prefix} The feature "${warning.feature}" is not supported.`;
      if (warning.details) {
        message += ` ${warning.details}`;
      }
      return message;
    }

    case 'compatibility': {
      let message = `${prefix} The feature "${warning.feature}" is used in a compatibility mode.`;
      if (warning.details) {
        message += ` ${warning.details}`;
      }
      return message;
    }

    case 'deprecated': {
      return `${prefix} Deprecated: "${warning.setting}". ${warning.message}`;
    }

    case 'other': {
      return `${prefix} ${warning.message}`;
    }

    default: {
      // 任何未知警告类型的后备
      return `${prefix} ${JSON.stringify(warning, null, 2)}`;
    }
  }
}

export const FIRST_WARNING_INFO_MESSAGE =
  'AI SDK Warning System: To turn off warning logging, set the AI_SDK_LOG_WARNINGS global to false.';

let hasLoggedBefore = false;

/**
 * 将警告记录到控制台或使用自定义记录器（如果已配置）。
 *
 * 可以通过“AI_SDK_LOG_WARNINGS”全局变量自定义该行为：
 * - 如果设置为“false”，则会抑制警告。
 * - 如果设置为函数，则调用该函数并发出警告。
 * - 否则，警告将使用“console.warn”记录到控制台。
 *
 * @param options - The options containing warnings and context.
 * @param options.warnings - The warnings to log.
 * @param options.provider - The provider id used for the call, if scoped to a specific provider.
 * @param options.model - The model id used for the call, if scoped to a specific provider.
 */
export const logWarnings: LogWarningsFunction = options => {
  // 如果警告数组为空，则不执行任何操作
  if (options.warnings.length === 0) {
    return;
  }

  const logger = globalThis.AI_SDK_LOG_WARNINGS;

  // 如果记录器设置为 false，则不执行任何操作
  if (logger === false) {
    return;
  }

  // 如果它是一个函数，则使用提供的记录器
  if (typeof logger === 'function') {
    logger(options);
    return;
  }

  // 第一次通话时显示信息注释
  if (!hasLoggedBefore) {
    hasLoggedBefore = true;
    console.info(FIRST_WARNING_INFO_MESSAGE);
  }

  // 默认行为：通过 process.emitWarning 记录警告（如果可用），否则通过 console.warn
  for (const warning of options.warnings) {
    const message = formatWarning({
      warning,
      provider: options.provider,
      model: options.model,
    });
    if (
      typeof process !== 'undefined' &&
      typeof process.emitWarning === 'function'
    ) {
      process.emitWarning(message, {
        type: warning.type === 'deprecated' ? 'DeprecationWarning' : 'Warning',
      });
    } else {
      console.warn(message);
    }
  }
};

/**
 * 重置内部日志记录状态。用于测试目的。
 */
export const resetLogWarningsState = () => {
  hasLoggedBefore = false;
};
