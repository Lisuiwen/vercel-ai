import {
  UnsupportedFunctionalityError,
  type LanguageModelV4FilePart,
} from '@ai-sdk/provider';
import {
  detectMediaType,
  getTopLevelMediaType,
  isFullMediaType,
} from './detect-media-type';

/**
 * 将文件部分的媒体类型解析为所需的完整“类型/子类型”形式
 * 其 API 需要完整 IANA 媒体类型的提供商。
 *
 * - 如果“part.mediaType”已经是完整的媒体类型（例如“image/png”），则它是
 *   按原样返回。
 * - 否则，当内联字节可用时（`part.data.type === 'data'`），
 *   使用签名表从字节中嗅探子类型
 *   对应于顶级段。
 * - 当两者都不适用时（例如仅具有 URL 源的顶级，或字节
 *   无法检测到），则会抛出“UnsupportedFunctionalityError”。
 */
export function resolveFullMediaType({
  part,
}: {
  part: LanguageModelV4FilePart;
}): string {
  if (isFullMediaType(part.mediaType)) {
    return part.mediaType;
  }

  if (part.data.type === 'data') {
    const detected = detectMediaType({
      data: part.data.data,
      topLevelType: getTopLevelMediaType(part.mediaType),
    });
    if (detected) {
      return detected;
    }

    throw new UnsupportedFunctionalityError({
      functionality: `file of media type "${part.mediaType}" must specify subtype since it could not be auto-detected`,
    });
  }

  throw new UnsupportedFunctionalityError({
    functionality: `file of media type "${part.mediaType}" must specify subtype since it is not passed as inline bytes`,
  });
}
