import { download as internalDownload } from './download';

/**
 * 创建具有可配置选项的下载功能。
 *
 * @param options - 下载功能的配置选项。
 * @param options.maxBytes - 允许的最大下载大小（以字节为单位）。默认值：2 GiB。
 * @returns 可以传递给 `transcribe()` 或 `experimental_generateVideo()` 的下载函数。
 */
export function createDownload(options?: { maxBytes?: number }) {
  return ({ url, abortSignal }: { url: URL; abortSignal?: AbortSignal }) =>
    internalDownload({ url, maxBytes: options?.maxBytes, abortSignal });
}
