import type {
  LanguageModelV4Content,
  LanguageModelV4StreamPart,
} from '@ai-sdk/provider';
import type { LanguageModelMiddleware } from '../types/language-model-middleware';
import { getPotentialStartIndex } from '../util/get-potential-start-index';

/**
 * 从生成的数据中提取 XML 标记的推理部分并将其公开
 * 作为结果的“推理”属性。
 *
 * @param tagName - 要从中提取推理的 XML 标记的名称。
 * @param separator - 在推理部分和文本部分之间使用的分隔符。
 * @param startWithReasoning - 是否从推理标记开始。
 */
export function extractReasoningMiddleware({
  tagName,
  separator = '\n',
  startWithReasoning = false,
}: {
  tagName: string;
  separator?: string;
  startWithReasoning?: boolean;
}): LanguageModelMiddleware {
  const openingTag = `<${tagName}>`;
  const closingTag = `<\/${tagName}>`;

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

        const text = startWithReasoning ? openingTag + part.text : part.text;

        const regexp = new RegExp(`${openingTag}(.*?)${closingTag}`, 'gs');
        const matches = Array.from(text.matchAll(regexp));

        if (!matches.length) {
          transformedContent.push(part);
          continue;
        }

        const reasoningText = matches.map(match => match[1]).join(separator);

        let textWithoutReasoning = text;
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i];

          const beforeMatch = textWithoutReasoning.slice(0, match.index);
          const afterMatch = textWithoutReasoning.slice(
            match.index! + match[0].length,
          );

          textWithoutReasoning =
            beforeMatch +
            (beforeMatch.length > 0 && afterMatch.length > 0 ? separator : '') +
            afterMatch;
        }

        transformedContent.push({
          type: 'reasoning',
          text: reasoningText,
        });

        transformedContent.push({
          type: 'text',
          text: textWithoutReasoning,
        });
      }

      return { content: transformedContent, ...rest };
    },

    wrapStream: async ({ doStream }) => {
      const { stream, ...rest } = await doStream();

      const reasoningExtractions: Record<
        string,
        {
          isFirstReasoning: boolean;
          isFirstText: boolean;
          afterSwitch: boolean;
          isReasoning: boolean;
          buffer: string;
          idCounter: number;
          textId: string;
        }
      > = {};

      let delayedTextStart: LanguageModelV4StreamPart | undefined;

      return {
        stream: stream.pipeThrough(
          new TransformStream<
            LanguageModelV4StreamPart,
            LanguageModelV4StreamPart
          >({
            transform: (chunk, controller) => {
              // 不要在`reasoning-start`之前发送`text-start`
              // https://github.com/vercel/ai/issues/7774
              if (chunk.type === 'text-start') {
                delayedTextStart = chunk;
                return;
              }

              if (chunk.type === 'text-end' && delayedTextStart) {
                controller.enqueue(delayedTextStart);
                delayedTextStart = undefined;
              }

              if (chunk.type !== 'text-delta') {
                controller.enqueue(chunk);
                return;
              }

              if (reasoningExtractions[chunk.id] == null) {
                reasoningExtractions[chunk.id] = {
                  isFirstReasoning: true,
                  isFirstText: true,
                  afterSwitch: false,
                  isReasoning: startWithReasoning,
                  buffer: '',
                  idCounter: 0,
                  textId: chunk.id,
                };
              }

              const activeExtraction = reasoningExtractions[chunk.id];

              activeExtraction.buffer += chunk.delta;

              function publish(text: string) {
                if (text.length > 0) {
                  const prefix =
                    activeExtraction.afterSwitch &&
                    (activeExtraction.isReasoning
                      ? !activeExtraction.isFirstReasoning
                      : !activeExtraction.isFirstText)
                      ? separator
                      : '';

                  if (
                    activeExtraction.isReasoning &&
                    (activeExtraction.afterSwitch ||
                      activeExtraction.isFirstReasoning)
                  ) {
                    controller.enqueue({
                      type: 'reasoning-start',
                      id: `reasoning-${activeExtraction.idCounter}`,
                    });
                  }

                  if (activeExtraction.isReasoning) {
                    controller.enqueue({
                      type: 'reasoning-delta',
                      delta: prefix + text,
                      id: `reasoning-${activeExtraction.idCounter}`,
                    });
                  } else {
                    if (delayedTextStart) {
                      controller.enqueue(delayedTextStart);
                      delayedTextStart = undefined;
                    }
                    controller.enqueue({
                      type: 'text-delta',
                      delta: prefix + text,
                      id: activeExtraction.textId,
                    });
                  }
                  activeExtraction.afterSwitch = false;

                  if (activeExtraction.isReasoning) {
                    activeExtraction.isFirstReasoning = false;
                  } else {
                    activeExtraction.isFirstText = false;
                  }
                }
              }

              do {
                const nextTag = activeExtraction.isReasoning
                  ? closingTag
                  : openingTag;

                const startIndex = getPotentialStartIndex(
                  activeExtraction.buffer,
                  nextTag,
                );

                // 未找到开始或结束标记，发布缓冲区
                if (startIndex == null) {
                  publish(activeExtraction.buffer);
                  activeExtraction.buffer = '';
                  break;
                }

                // 在标签之前发布文本
                publish(activeExtraction.buffer.slice(0, startIndex));

                const foundFullMatch =
                  startIndex + nextTag.length <= activeExtraction.buffer.length;

                if (foundFullMatch) {
                  activeExtraction.buffer = activeExtraction.buffer.slice(
                    startIndex + nextTag.length,
                  );

                  if (activeExtraction.isReasoning) {
                    // 为空推理块发出推理开始（未发布增量）。
                    // 这可以处理两种情况：
                    // - startWithReasoning=false: <think></think> (afterSwitch=true)
                    // - startWithReasoning=true：立即</think> (afterSwitch=false)
                    if (activeExtraction.isFirstReasoning) {
                      controller.enqueue({
                        type: 'reasoning-start',
                        id: `reasoning-${activeExtraction.idCounter}`,
                      });
                    }

                    // 推理部分完成：
                    controller.enqueue({
                      type: 'reasoning-end',
                      id: `reasoning-${activeExtraction.idCounter++}`,
                    });
                  }

                  activeExtraction.isReasoning = !activeExtraction.isReasoning;
                  activeExtraction.afterSwitch = true;
                } else {
                  activeExtraction.buffer =
                    activeExtraction.buffer.slice(startIndex);
                  break;
                }
              } while (true);
            },
          }),
        ),
        ...rest,
      };
    },
  };
}
