import type { EmbeddingModelV2, EmbeddingModelV3 } from '@ai-sdk/provider';
import { logV2CompatibilityWarning } from '../util/log-v2-compatibility-warning';

export function asEmbeddingModelV3(
  model: EmbeddingModelV2<string> | EmbeddingModelV3,
): EmbeddingModelV3 {
  if (model.specificationVersion === 'v3') {
    return model;
  }

  logV2CompatibilityWarning({
    provider: model.provider,
    modelId: model.modelId,
  });

  // TODO 这可能会破坏，我们需要正确地将 v2 映射到 v3
  // 并支持所有相关的 v3 属性：
  return new Proxy(model, {
    get(target, prop: keyof EmbeddingModelV2<string>) {
      if (prop === 'specificationVersion') return 'v3';
      return target[prop];
    },
  }) as unknown as EmbeddingModelV3;
}
