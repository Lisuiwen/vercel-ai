import type {
  LanguageModelV4Content,
  LanguageModelV4StreamPart,
} from '@ai-sdk/provider';
import type { LanguageModelMiddleware } from '../types/language-model-middleware';

/**
 * 默认转换函数，从文本中去除 Markdown 代码围栏。
 */
function defaultTransform(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();
}

/**
 * 通过剥离从文本内容中提取 JSON 的中间件
 * Markdown 代码围栏和其他格式。
 *
 * 当将 Output.object() 与包装模型一起使用时，这非常有用
 * Markdown 代码块中的 JSON 响应。
 *
 * @param options - Configuration options for the middleware.
 * @param options.transform - Custom transform function. If provided, this will be
 * 使用而不是默认的降价栅栏剥离。
 */
export function extractJsonMiddleware(options?: {
  /**
   * 应用于文本内容的自定义转换函数。
   * 接收原始文本并应返回转换后的文本。
   * 如果未提供，默认转换会去除 Markdown 代码围栏。
   */
  transform?: (text: string) => string;
}): LanguageModelMiddleware {
  const transform = options?.transform ?? defaultTransform;
  const hasCustomTransform = options?.transform !== undefined;

  return {
    specificationVersion: 'v4',

    wrapGenerate: async ({ doGenerate }) => {
      const { content, ...rest } = await doGenerate();

      const transformedContent: LanguageModelV4Content[] = [];
      for (const part of content) {
        if (part.type !== 'text') {
          transformedContent.push(part);
          continue;
        }

        transformedContent.push({
          ...part,
          text: transform(part.text),
        });
      }

      return { content: transformedContent, ...rest };
    },
    wrapStream: async ({ doStream }) => {
      const { stream, ...rest } = await doStream();

      const textBlocks: Record<
        string,
        {
          startEvent: LanguageModelV4StreamPart;
          phase: 'prefix' | 'streaming' | 'buffering';
          buffer: string;
          prefixStripped: boolean;
        }
      > = {};

      const SUFFIX_BUFFER_SIZE = 12;

      return {
        stream: stream.pipeThrough(
          new TransformStream<
            LanguageModelV4StreamPart,
            LanguageModelV4StreamPart
          >({
            transform: (chunk, controller) => {
              if (chunk.type === 'text-start') {
                textBlocks[chunk.id] = {
                  startEvent: chunk,
                  // 自定义转换需要缓冲所有内容
                  phase: hasCustomTransform ? 'buffering' : 'prefix',
                  buffer: '',
                  prefixStripped: false,
                };
                return;
              }

              if (chunk.type === 'text-delta') {
                const block = textBlocks[chunk.id];
                if (!block) {
                  controller.enqueue(chunk);
                  return;
                }

                block.buffer += chunk.delta;

                // 自定义转换：缓冲所有内容，最后转换
                if (block.phase === 'buffering') {
                  return;
                }

                if (block.phase === 'prefix') {
                  // 检查我们是否可以确定前缀状态
                  if (
                    block.buffer.length > 0 &&
                    !block.buffer.startsWith('`')
                  ) {
                    block.phase = 'streaming';
                    controller.enqueue(block.startEvent);
                  } else if (block.buffer.startsWith('```')) {
                    // 仅当我们有换行符时才去除前缀（栅栏已完成）
                    if (block.buffer.includes('\n')) {
                      const prefixMatch =
                        block.buffer.match(/^```(?:json)?\s*\n/);
                      if (prefixMatch) {
                        block.buffer = block.buffer.slice(
                          prefixMatch[0].length,
                        );
                        block.prefixStripped = true;
                        block.phase = 'streaming';
                        controller.enqueue(block.startEvent);
                      } else {
                        // Has newline but doesn't match fence pattern
                        block.phase = 'streaming';
                        controller.enqueue(block.startEvent);
                      }
                    }
                    // else keep buffering until we see a newline
                  } else if (
                    block.buffer.length >= 3 &&
                    !block.buffer.startsWith('```')
                  ) {
                    block.phase = 'streaming';
                    controller.enqueue(block.startEvent);
                  }
                }

                // Stream content
                if (
                  block.phase === 'streaming' &&
                  block.buffer.length > SUFFIX_BUFFER_SIZE
                ) {
                  const toStream = block.buffer.slice(0, -SUFFIX_BUFFER_SIZE);
                  block.buffer = block.buffer.slice(-SUFFIX_BUFFER_SIZE);
                  controller.enqueue({
                    type: 'text-delta',
                    id: chunk.id,
                    delta: toStream,
                  });
                }
                return;
              }

              if (chunk.type === 'text-end') {
                const block = textBlocks[chunk.id];
                if (block) {
                  if (block.phase === 'prefix' || block.phase === 'buffering') {
                    controller.enqueue(block.startEvent);
                  }

                  let remaining = block.buffer;
                  if (block.phase === 'buffering') {
                    remaining = transform(remaining);
                  } else if (block.prefixStripped) {
                    // strip suffix since prefix already handled
                    remaining = remaining.replace(/\n?```\s*$/, '').trimEnd();
                  } else {
                    // Apply full transform (handles both prefix and suffix)
                    remaining = transform(remaining);
                  }

                  if (remaining.length > 0) {
                    controller.enqueue({
                      type: 'text-delta',
                      id: chunk.id,
                      delta: remaining,
                    });
                  }
                  controller.enqueue(chunk);
                  delete textBlocks[chunk.id];
                  return;
                }
              }
              controller.enqueue(chunk);
            },
          }),
        ),
        ...rest,
      };
    },
  };
}
