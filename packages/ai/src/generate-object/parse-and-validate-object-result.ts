import { JSONParseError, TypeValidationError } from '@ai-sdk/provider';
import { safeParseJSON } from '@ai-sdk/provider-utils';
import { NoObjectGeneratedError } from '../error/no-object-generated-error';
import type {
  FinishReason,
  LanguageModelResponseMetadata,
  LanguageModelUsage,
} from '../types';
import type { OutputStrategy } from './output-strategy';
import type { RepairTextFunction } from './repair-text';

/**
 * 通过将结果字符串解析为JSON并根据输出策略进行验证来解析和验证结果字符串。
 *
 * @param result - 要解析和验证的结果字符串
 * @param outputStrategy - 包含验证逻辑的输出策略
 * @param context - 错误报告的附加上下文
 * @returns 验证结果
 * 如果解析或验证失败，则@抛出NoObjectGenerateError
 */
async function parseAndValidateObjectResult<RESULT>(
  result: string,
  outputStrategy: OutputStrategy<any, RESULT, any>,
  context: {
    response: Omit<LanguageModelResponseMetadata, 'messages'>;
    usage: LanguageModelUsage;
    finishReason: FinishReason;
  },
): Promise<RESULT> {
  const parseResult = await safeParseJSON({ text: result });

  if (!parseResult.success) {
    throw new NoObjectGeneratedError({
      message: 'No object generated: could not parse the response.',
      cause: parseResult.error,
      text: result,
      response: context.response,
      usage: context.usage,
      finishReason: context.finishReason,
    });
  }

  const validationResult = await outputStrategy.validateFinalResult(
    parseResult.value,
    {
      text: result,
      response: context.response,
      usage: context.usage,
    },
  );

  if (!validationResult.success) {
    throw new NoObjectGeneratedError({
      message: 'No object generated: response did not match schema.',
      cause: validationResult.error,
      text: result,
      response: context.response,
      usage: context.usage,
      finishReason: context.finishReason,
    });
  }

  return validationResult.value;
}

/**
 * 通过将结果字符串解析为JSON并根据输出策略进行验证来解析和验证结果字符串。
 * 如果无法解析结果，将尝试使用 RepairText 函数修复结果。
 *
 * @param result - 要解析和验证的结果字符串
 * @param outputStrategy - 包含验证逻辑的输出策略
 * @param repairText - 尝试修复结果字符串的函数
 * @param context - 错误报告的附加上下文
 * @returns 验证结果
 * 如果解析或验证失败，则@抛出NoObjectGenerateError
 */
export async function parseAndValidateObjectResultWithRepair<RESULT>(
  result: string,
  outputStrategy: OutputStrategy<any, RESULT, any>,
  repairText: RepairTextFunction | undefined,
  context: {
    response: Omit<LanguageModelResponseMetadata, 'messages'>;
    usage: LanguageModelUsage;
    finishReason: FinishReason;
  },
): Promise<RESULT> {
  try {
    return await parseAndValidateObjectResult(result, outputStrategy, context);
  } catch (error) {
    if (
      repairText != null &&
      NoObjectGeneratedError.isInstance(error) &&
      (JSONParseError.isInstance(error.cause) ||
        TypeValidationError.isInstance(error.cause))
    ) {
      const repairedText = await repairText({
        text: result,
        error: error.cause,
      });
      if (repairedText === null) {
        throw error;
      }
      return await parseAndValidateObjectResult(
        repairedText,
        outputStrategy,
        context,
      );
    }
    throw error;
  }
}
