import type {
  TranscriptionModelV2,
  TranscriptionModelV3,
  TranscriptionModelV4,
} from '@ai-sdk/provider';
import { asTranscriptionModelV3 } from './as-transcription-model-v3';

export function asTranscriptionModelV4(
  model: TranscriptionModelV2 | TranscriptionModelV3 | TranscriptionModelV4,
): TranscriptionModelV4 {
  if (model.specificationVersion === 'v4') {
    return model;
  }

  // 首先将 v2 转换为 v3，然后将 v3 代理为 v4：
  const v3Model =
    model.specificationVersion === 'v2' ? asTranscriptionModelV3(model) : model;

  return new Proxy(v3Model, {
    get(target, prop: keyof TranscriptionModelV3) {
      if (prop === 'specificationVersion') return 'v4';
      return target[prop];
    },
  }) as unknown as TranscriptionModelV4;
}
