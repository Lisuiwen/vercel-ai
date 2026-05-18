export function isSupportedFileUrl(url: URL): boolean {
  const urlString = url.toString();

  // Google 生成语言文件 API
  if (
    urlString.startsWith(
      'https://generativelanguage.googleapis.com/v1beta/files/',
    )
  ) {
    return true;
  }

  // YouTube URL（公开或不公开的视频）
  const youtubeRegexes = [
    /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+(?:&[\w=&.-]*)?$/,
    /^https:\/\/youtu\.be\/[\w-]+(?:\?[\w=&.-]*)?$/,
  ];

  return youtubeRegexes.some(regex => regex.test(urlString));
}
