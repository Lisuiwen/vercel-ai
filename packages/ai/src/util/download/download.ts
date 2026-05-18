import {
  DownloadError,
  readResponseWithSizeLimit,
  DEFAULT_MAX_DOWNLOAD_SIZE,
  validateDownloadUrl,
  withUserAgentSuffix,
  getRuntimeEnvironmentUserAgent,
} from '@ai-sdk/provider-utils';
import { VERSION } from '../../version';

/**
 * 从URL下载文件。
 *
 * @param url - 从中下载的 URL。
 * @param maxBytes - 允许的最大下载大小（以字节为单位）。默认为 100 MiB。
 * @param abortSignal - 用于取消下载的可选中止信号。
 * @returns 下载的数据和媒体类型。
 *
 * 如果下载失败或超过 maxBytes，则@抛出 DownloadError。
 */
export const download = async ({
  url,
  maxBytes,
  abortSignal,
}: {
  url: URL;
  maxBytes?: number;
  abortSignal?: AbortSignal;
}) => {
  const urlText = url.toString();
  validateDownloadUrl(urlText);
  try {
    const response = await fetch(urlText, {
      headers: withUserAgentSuffix(
        {},
        `ai-sdk/${VERSION}`,
        getRuntimeEnvironmentUserAgent(),
      ),
      signal: abortSignal,
    });

    // 重定向后验证最终URL，以通过开放重定向防止SSRF
    if (response.redirected) {
      validateDownloadUrl(response.url);
    }

    if (!response.ok) {
      throw new DownloadError({
        url: urlText,
        statusCode: response.status,
        statusText: response.statusText,
      });
    }

    const data = await readResponseWithSizeLimit({
      response,
      url: urlText,
      maxBytes: maxBytes ?? DEFAULT_MAX_DOWNLOAD_SIZE,
    });

    return {
      data,
      mediaType: response.headers.get('content-type') ?? undefined,
    };
  } catch (error) {
    if (DownloadError.isInstance(error)) {
      throw error;
    }

    throw new DownloadError({ url: urlText, cause: error });
  }
};
