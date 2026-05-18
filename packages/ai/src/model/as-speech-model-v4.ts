import type {
  SpeechModelV2,
  SpeechModelV3,
  SpeechModelV4,
} from '@ai-sdk/provider';
import { asSpeechModelV3 } from './as-speech-model-v3';

export function asSpeechModelV4(
  model: SpeechModelV2 | SpeechModelV3 | SpeechModelV4,
): SpeechModelV4 {
  if (model.specificationVersion === 'v4') {
    return model;
  }

  // 首先将 v2 转换为 v3，然后将 v3 代理为 v4：
  const v3Model =
    model.specificationVersion === 'v2' ? asSpeechModelV3(model) : model;

  return new Proxy(v3Model, {
    get(target, prop: keyof SpeechModelV3) {
      if (prop === 'specificationVersion') return 'v4';
      return target[prop];
    },
  }) as unknown as SpeechModelV4;
}
