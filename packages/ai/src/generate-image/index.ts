import type { GenerateImageResult } from './generate-image-result';
import { generateImage } from './generate-image';

export { generateImage } from './generate-image';
export type { GenerateImageResult } from './generate-image-result';

// 已弃用的导出

/**
 * @deprecated 请改用`generateImage`。
 */
const experimental_generateImage = generateImage;
export { experimental_generateImage };

/**
 * @deprecated 请改用`GenerateImageResult`。
 */
type Experimental_GenerateImageResult = GenerateImageResult;
export type { Experimental_GenerateImageResult };
