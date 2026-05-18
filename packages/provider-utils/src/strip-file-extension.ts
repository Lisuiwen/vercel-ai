/**
 * 从文件名中去除文件扩展名段。
 *
 * 示例：
 * - “报告.pdf” -> “报告”
 * - “archive.tar.gz” -> “存档”
 * -“文件名”->“文件名”
 */
export function stripFileExtension(filename: string): string {
  const firstDotIndex = filename.indexOf('.');

  return firstDotIndex === -1 ? filename : filename.slice(0, firstDotIndex);
}
