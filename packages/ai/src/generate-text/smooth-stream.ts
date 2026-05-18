import { delay as originalDelay, type ToolSet } from '@ai-sdk/provider-utils';
import {
  InvalidArgumentError,
  type SharedV4ProviderMetadata,
} from '@ai-sdk/provider';
import type { TextStreamPart } from './stream-text-result';

const CHUNKING_REGEXPS = {
  word: /\S+\s+/m,
  line: /\n+/m,
};

/**
 * 检测缓冲区中的第一个块。
 *
 * @param buffer - 用于检测第一个块的缓冲区。
 *
 * @returns 第一个检测到的块，如果未检测到块，则为`未定义`。
 */
export type ChunkDetector = (buffer: string) => string | undefined | null;

/**
 * 平滑文本和推理流输出。
 *
 * @param delayInMs - 每个块之间的延迟（以毫秒为单位）。默认为 10 毫秒。可以设置为`null`来跳过延迟。
 * @param chunking - 控制如何对文本进行分块以进行流式传输。使用`word`逐字流式传输（默认），使用`line`逐行流式传输，为自定义分块提供自定义 RegExp 模式，为区域设置感知分词提供 Intl.Segmenter（推荐用于 CJK 语言），或提供自定义 ChunkDetector 函数。
 *
 * @returns 平滑文本流输出的转换流。
 */
export function smoothStream<TOOLS extends ToolSet>({
  delayInMs = 10,
  chunking = 'word',
  _internal: { delay = originalDelay } = {},
}: {
  delayInMs?: number | null;
  chunking?: 'word' | 'line' | RegExp | ChunkDetector | Intl.Segmenter;
  /**
   * 内部的。仅供测试使用。可能会更改，恕不另行通知。
   */
  _internal?: {
    delay?: (delayInMs: number | null) => Promise<void>;
  };
} = {}): (options: {
  tools: TOOLS;
}) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>> {
  let detectChunk: ChunkDetector;

  // 检查分块是否为Intl.Segmenter（分割方法的鸭子类型）
  if (
    chunking != null &&
    typeof chunking === 'object' &&
    'segment' in chunking &&
    typeof chunking.segment === 'function'
  ) {
    const segmenter = chunking as Intl.Segmenter;
    detectChunk = (buffer: string) => {
      if (buffer.length === 0) return null;
      const iterator = segmenter.segment(buffer)[Symbol.iterator]();
      const first = iterator.next().value;
      return first?.segment || null;
    };
  } else if (typeof chunking === 'function') {
    detectChunk = buffer => {
      const match = chunking(buffer);

      if (match == null) {
        return null;
      }

      if (!match.length) {
        throw new Error(`Chunking function must return a non-empty string.`);
      }

      if (!buffer.startsWith(match)) {
        throw new Error(
          `Chunking function must return a match that is a prefix of the buffer. Received: "${match}" expected to start with "${buffer}"`,
        );
      }

      return match;
    };
  } else {
    const chunkingRegex =
      typeof chunking === 'string'
        ? CHUNKING_REGEXPS[chunking]
        : chunking instanceof RegExp
          ? chunking
          : undefined;

    if (chunkingRegex == null) {
      throw new InvalidArgumentError({
        argument: 'chunking',
        message: `Chunking must be "word", "line", a RegExp, an Intl.Segmenter, or a ChunkDetector function. Received: ${chunking}`,
      });
    }

    detectChunk = buffer => {
      const match = chunkingRegex.exec(buffer);

      if (!match) {
        return null;
      }

      return buffer.slice(0, match.index) + match?.[0];
    };
  }

  return () => {
    let buffer = '';
    let id = '';
    let type: 'text-delta' | 'reasoning-delta' | undefined = undefined;
    let providerMetadata: SharedV4ProviderMetadata | undefined = undefined;

    function flushBuffer(
      controller: TransformStreamDefaultController<TextStreamPart<TOOLS>>,
    ) {
      if (buffer.length > 0 && type !== undefined) {
        controller.enqueue({
          type,
          text: buffer,
          id,
          ...(providerMetadata != null ? { providerMetadata } : {}),
        });
        buffer = '';
        providerMetadata = undefined;
      }
    }

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      async transform(chunk, controller) {
        // 处理不可平滑的块：刷新缓冲区并通过
        if (chunk.type !== 'text-delta' && chunk.type !== 'reasoning-delta') {
          flushBuffer(controller);
          controller.enqueue(chunk);
          return;
        }

        // 当类型或 ID 更改时刷新状态
        if ((chunk.type !== type || chunk.id !== id) && buffer.length > 0) {
          flushBuffer(controller);
        }

        buffer += chunk.text;
        id = chunk.id;
        type = chunk.type;

        // 保留提供者元数据（例如，人择思维签名）
        if (chunk.providerMetadata != null) {
          providerMetadata = chunk.providerMetadata;
        }

        let match;

        while ((match = detectChunk(buffer)) != null) {
          controller.enqueue({ type, text: match, id });
          buffer = buffer.slice(match.length);

          await delay(delayInMs);
        }
      },
    });
  };
}
