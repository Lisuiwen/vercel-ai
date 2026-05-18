/**
 * 将媒体类型映射到其相应的文件扩展名。
 * 最初引入它是为了设置音频文件上传的文件名
 * 在 https://github.com/vercel/ai/pull/8159 中。
 *
 * @param mediaType The media type to map.
 * @returns The corresponding file extension
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types
 */
export function mediaTypeToExtension(mediaType: string) {
  const [_type, subtype = ''] = mediaType.toLowerCase().split('/');

  return (
    {
      mpeg: 'mp3',
      'x-wav': 'wav',
      opus: 'ogg',
      mp4: 'm4a',
      'x-m4a': 'm4a',
    }[subtype] ?? subtype
  );
}
