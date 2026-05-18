import { AISDKError } from '@ai-sdk/provider';

const name = 'AI_UIMessageStreamError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 当UI消息流包含无效或无序块时引发错误。
 *
 * 这通常发生在以下情况：
 * - 接收到增量块但没有相应的起始块
 * - 接收到一个结束块而没有相应的开始块
 * - 未找到给定 toolCallId 的工具调用
 *
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-ui-message-stream-error
 */
export class UIMessageStreamError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  /**
   * 导致错误的块的类型（例如，`text-delta`、`reasoning-end`）。
   */
  readonly chunkType: string;

  /**
   * 与失败块关联的ID（ widget ID 或 toolCallId）。
   */
  readonly chunkId: string;

  constructor({
    chunkType,
    chunkId,
    message,
  }: {
    chunkType: string;
    chunkId: string;
    message: string;
  }) {
    super({ name, message });

    this.chunkType = chunkType;
    this.chunkId = chunkId;
  }

  static isInstance(error: unknown): error is UIMessageStreamError {
    return AISDKError.hasMarker(error, marker);
  }
}
