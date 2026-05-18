/**
 * 检查模型是否原生支持给定的 URL。
 *
 * @param mediaType - The media type of the URL. Case-sensitive. May be a full
 *                    `type/subtype`、通配符 `type/*`，或者只是
 *                    顶级段（例如“图像”）。
 * @param url - The URL to check.
 * @param supportedUrls - A record where keys are case-sensitive media types (or '*')
 *                        值是 URL 的 RegExp 模式数组。
 *
 * @returns `true` if the URL matches a pattern under the specific media type
 *          或通配符“*”，否则为“false”。
 */
export function isUrlSupported({
  mediaType,
  url,
  supportedUrls,
}: {
  mediaType: string;
  url: string;
  supportedUrls: Record<string, RegExp[]>;
}): boolean {
  // 将媒体类型和 url 标准化为小写
  url = url.toLowerCase();
  mediaType = mediaType.toLowerCase();

  const isTopLevelOnly = !mediaType.includes('/');

  return (
    Object.entries(supportedUrls)
      // 将支持的 url 映射标准化为小写前缀：
      .map(([key, value]) => {
        const mediaType = key.toLowerCase();
        return mediaType === '*' || mediaType === '*/*'
          ? { mediaTypePrefix: '', regexes: value }
          : { mediaTypePrefix: mediaType.replace(/\*/, ''), regexes: value };
      })
      // 从匹配的媒体类型前缀中收集所有正则表达式模式：
      .filter(({ mediaTypePrefix }) => {
        if (mediaTypePrefix === '') {
          return true;
        }
        // 对于仅顶级媒体类型（例如“image”），我们无法确定
        // 特定子类型（例如“image/png”）是否适用，所以我们
        // 仅与相应的“type/*”前缀完全匹配。
        if (isTopLevelOnly) {
          return `${mediaType}/` === mediaTypePrefix;
        }
        return mediaType.startsWith(mediaTypePrefix);
      })
      .flatMap(({ regexes }) => regexes)
      // 检查是否有任何模式与 url 匹配：
      .some(pattern => pattern.test(url))
  );
}
