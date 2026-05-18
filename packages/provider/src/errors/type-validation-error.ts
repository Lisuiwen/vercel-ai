import { AISDKError } from './ai-sdk-error';
import { getErrorMessage } from './get-error-message';

const name = 'AI_TypeValidationError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export interface TypeValidationContext {
  /**
   * 点表示法中的字段路径（例如，“message.metadata”、“message.parts[3].data”）
   */
  field?: string;

  /**
   * 实体名称（例如工具名称、数据类型名称）
   */
  entityName?: string;

  /**
   * 实体标识符（例如消息 ID、工具调用 ID）
   */
  entityId?: string;
}

export class TypeValidationError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly value: unknown;
  readonly context?: TypeValidationContext;

  constructor({
    value,
    cause,
    context,
  }: {
    value: unknown;
    cause: unknown;
    context?: TypeValidationContext;
  }) {
    let contextPrefix = 'Type validation failed';

    if (context?.field) {
      contextPrefix += ` for ${context.field}`;
    }

    if (context?.entityName || context?.entityId) {
      contextPrefix += ' (';
      const parts: string[] = [];
      if (context.entityName) {
        parts.push(context.entityName);
      }
      if (context.entityId) {
        parts.push(`id: "${context.entityId}"`);
      }
      contextPrefix += parts.join(', ');
      contextPrefix += ')';
    }

    super({
      name,
      message:
        `${contextPrefix}: ` +
        `Value: ${JSON.stringify(value)}.\n` +
        `Error message: ${getErrorMessage(cause)}`,
      cause,
    });

    this.value = value;
    this.context = context;
  }

  static isInstance(error: unknown): error is TypeValidationError {
    return AISDKError.hasMarker(error, marker);
  }

  /**
   * 将错误包装到 TypeValidationError 中。
   * 如果原因已经是具有相同值和上下文的 TypeValidationError，则返回原因。
   * 否则，它会创建一个新的 TypeValidationError。
   *
   * @param {Object} params - The parameters for wrapping the error.
   * @param {unknown} params.value - The value that failed validation.
   * @param {unknown} params.cause - The original error or cause of the validation failure.
   * @param {TypeValidationContext} params.context - Optional context about what is being validated.
   * @returns {TypeValidationError} A TypeValidationError instance.
   */
  static wrap({
    value,
    cause,
    context,
  }: {
    value: unknown;
    cause: unknown;
    context?: TypeValidationContext;
  }): TypeValidationError {
    if (
      TypeValidationError.isInstance(cause) &&
      cause.value === value &&
      cause.context?.field === context?.field &&
      cause.context?.entityName === context?.entityName &&
      cause.context?.entityId === context?.entityId
    ) {
      return cause;
    }

    return new TypeValidationError({ value, cause, context });
  }
}
