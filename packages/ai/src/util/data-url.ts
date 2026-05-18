/**
 * 将 text/* 类型的数据 URL 转换为文本字符串。
 */
export function getTextFromDataUrl(dataUrl: string): string {
  const [header, base64Content] = dataUrl.split(',');
  const mediaType = header.split(';')[0].split(':')[1];

  if (mediaType == null || base64Content == null) {
    throw new Error('Invalid data URL format');
  }

  try {
    return window.atob(base64Content);
  } catch {
    throw new Error(`Error decoding data URL`);
  }
}
