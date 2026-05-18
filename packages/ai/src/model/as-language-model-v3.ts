import type {
  LanguageModelV2,
  LanguageModelV2FinishReason,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
  LanguageModelV3,
  LanguageModelV3FinishReason,
  LanguageModelV3StreamPart,
  LanguageModelV3Usage,
} from '@ai-sdk/provider';
import { logV2CompatibilityWarning } from '../util/log-v2-compatibility-warning';

export function asLanguageModelV3(
  model: LanguageModelV2 | LanguageModelV3,
): LanguageModelV3 {
  if (model.specificationVersion === 'v3') {
    return model;
  }

  logV2CompatibilityWarning({
    provider: model.provider,
    modelId: model.modelId,
  });

  // TODO 这可能会破坏，我们需要正确地将 v2 映射到 v3
  // 并支持所有相关的v3属性：
  return new Proxy(model, {
    get(target, prop: keyof LanguageModelV2) {
      switch (prop) {
        case 'specificationVersion':
          return 'v3';
        case 'doGenerate':
          return async (...args: Parameters<LanguageModelV2['doGenerate']>) => {
            const result = await target.doGenerate(...args);
            return {
              ...result,
              finishReason: convertV2FinishReasonToV3(result.finishReason),
              usage: convertV2UsageToV3(result.usage),
            };
          };
        case 'doStream':
          return async (...args: Parameters<LanguageModelV2['doStream']>) => {
            const result = await target.doStream(...args);
            return {
              ...result,
              stream: convertV2StreamToV3(result.stream),
            };
          };
        default:
          return target[prop];
      }
    },
  }) as unknown as LanguageModelV3;
}

function convertV2StreamToV3(
  stream: ReadableStream<LanguageModelV2StreamPart>,
): ReadableStream<LanguageModelV3StreamPart> {
  return stream.pipeThrough(
    new TransformStream<LanguageModelV2StreamPart, LanguageModelV3StreamPart>({
      transform(chunk, controller) {
        switch (chunk.type) {
          case 'finish':
            controller.enqueue({
              ...chunk,
              finishReason: convertV2FinishReasonToV3(chunk.finishReason),
              usage: convertV2UsageToV3(chunk.usage),
            });
            break;
          default:
            // TODO：AI SDK 6 - 无转换（需要映射流部分）
            controller.enqueue(chunk as LanguageModelV3StreamPart);
            break;
        }
      },
    }),
  );
}

function convertV2FinishReasonToV3(
  finishReason: LanguageModelV2FinishReason,
): LanguageModelV3FinishReason {
  return {
    unified: finishReason === 'unknown' ? 'other' : finishReason,
    raw: undefined,
  };
}

function convertV2UsageToV3(usage: LanguageModelV2Usage): LanguageModelV3Usage {
  return {
    inputTokens: {
      total: usage.inputTokens,
      noCache: undefined,
      cacheRead: usage.cachedInputTokens,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: usage.outputTokens,
      text: undefined,
      reasoning: usage.reasoningTokens,
    },
  };
}
