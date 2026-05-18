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
 * @param buffer - The buffer to detect the first chunk in.
 *
 * @returns The first detected chunk, or `undefined` if no chunk was detected.
 */
export type ChunkDetector = (buffer: string) => string | undefined | null;

/**
 * 平滑文本和推理流输出。
 *
 * @param delayInMs - The delay in milliseconds between each chunk. Defaults to 10ms. Can be set to `null` to skip the delay.
 * @param chunking - Controls how the text is chunked for streaming. Use "word" to stream word by word (default), "line" to stream line by line, provide a custom RegExp pattern for custom chunking, provide an Intl.Segmenter for locale-aware word segmentation (recommended for CJK languages), or provide a custom ChunkDetector function.
 *
 * @returns A transform stream that smooths text streaming output.
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

  // 检查分块是否是 Intl.Segmenter（分段方法的鸭子类型）
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

        // 当类型或 ID 更改时刷新缓冲区
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
