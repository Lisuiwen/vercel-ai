import { DownloadError } from './download-error';

/**
 * 默认最大下载大小：2 GiB。
 *
 * `fetch().arrayBuffer()` 的峰值内存开销约为 2 倍（undici 缓冲
 * body 内部，然后创建 JS ArrayBuffer），因此下载量非常大
 * 超过 64 位系统上默认 V8 堆限制并终止的风险
 * 出现内存不足错误的进程。
 *
 * 设置此限制会将不可恢复的 OOM 崩溃转换为可捕获的
 * `下载错误`。
 */
export const DEFAULT_MAX_DOWNLOAD_SIZE = 2 * 1024 * 1024 * 1024;

/**
 * 读取具有大小限制的获取响应主体，以防止内存耗尽。
 *
 * 检查 Content-Length 标头以了解早期拒绝情况，然后读取正文
 * 通过 ReadableStream 递增，并在下载错误时中止
 * 超出限制。
 *
 * @param response - The fetch Response to read.
 * @param url - The URL being downloaded (used in error messages).
 * @param maxBytes - Maximum allowed bytes. Defaults to DEFAULT_MAX_DOWNLOAD_SIZE.
 * @returns A Uint8Array containing the response body.
 * @throws DownloadError if the response exceeds maxBytes.
 */
export async function readResponseWithSizeLimit({
  response,
  url,
  maxBytes = DEFAULT_MAX_DOWNLOAD_SIZE,
}: {
  response: Response;
  url: string;
  maxBytes?: number;
}): Promise<Uint8Array> {
  // 基于 Content-Length 标头的早期拒绝
  const contentLength = response.headers.get('content-length');
  if (contentLength != null) {
    const length = parseInt(contentLength, 10);
    if (!isNaN(length) && length > maxBytes) {
      throw new DownloadError({
        url,
        message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes (Content-Length: ${length}).`,
      });
    }
  }

  const body = response.body;

  // 处理缺失的主体（空响应）
  if (body == null) {
    return new Uint8Array(0);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.length;

      if (totalBytes > maxBytes) {
        throw new DownloadError({
          url,
          message: `Download of ${url} exceeded maximum size of ${maxBytes} bytes.`,
        });
      }

      chunks.push(value);
    }
  } finally {
    try {
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }

  // 将块连接成单个 Uint8Array
  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
