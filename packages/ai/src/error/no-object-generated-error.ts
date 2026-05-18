import { AISDKError } from '@ai-sdk/provider';
import type { FinishReason } from '../types/language-model';
import type { LanguageModelResponseMetadata } from '../types/language-model-response-metadata';
import type { LanguageModelUsage } from '../types/usage';

const name = 'AI_NoObjectGeneratedError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 当无法生成对象时抛出。这可能有几个原因：
 *
 * - 模型无法生成响应。
 * - 模型生成了无法解析的响应。
 * - 模型生成的响应无法根据架构进行验证。
 *
 * 该错误包含以下属性：
 *
 * - `text`：模型生成的文本。这可以是原始文本或工具调用文本，具体取决于模型。
 */
export class NoObjectGeneratedError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  /**
   * 由模型生成的文本。这可以是原始文本或工具调用文本，具体取决于型号。
   */
  readonly text: string | undefined;

  /**
   * 响应元数据。
   */
  readonly response:
    | Omit<LanguageModelResponseMetadata, 'messages'>
    | undefined;

  /**
   * 模型的使用。
   */
  readonly usage: LanguageModelUsage | undefined;

  /**
   * 模型完成生成响应的原因。
   */
  readonly finishReason: FinishReason | undefined;

  constructor({
    message = 'No object generated.',
    cause,
    text,
    response,
    usage,
    finishReason,
  }: {
    message?: string;
    cause?: Error;
    text?: string;
    response: Omit<LanguageModelResponseMetadata, 'messages'>;
    usage: LanguageModelUsage;
    finishReason: FinishReason;
  }) {
    super({ name, message, cause });

    this.text = text;
    this.response = response;
    this.usage = usage;
    this.finishReason = finishReason;
  }

  static isInstance(error: unknown): error is NoObjectGeneratedError {
    return AISDKError.hasMarker(error, marker);
  }
}
