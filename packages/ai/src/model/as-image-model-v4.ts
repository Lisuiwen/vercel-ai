import type {
  ImageModelV2,
  ImageModelV3,
  ImageModelV4,
} from '@ai-sdk/provider';
import { asImageModelV3 } from './as-image-model-v3';

export function asImageModelV4(
  model: ImageModelV2 | ImageModelV3 | ImageModelV4,
): ImageModelV4 {
  if (model.specificationVersion === 'v4') {
    return model;
  }

  // 首先将 v2 转换为 v3，然后将 v3 代理为 v4：
  const v3Model =
    model.specificationVersion === 'v2' ? asImageModelV3(model) : model;

  return new Proxy(v3Model, {
    get(target, prop: keyof ImageModelV3) {
      if (prop === 'specificationVersion') return 'v4';
      return target[prop];
    },
  }) as unknown as ImageModelV4;
}
