import { download as originalDownload } from './download';

/**
 * 实验性的。可以在没有警告的情况下更改补丁版本。
 *
 * 下载功能。使用 URL 数组和指示的布尔值进行调用
 * 该 URL 是否受模型支持。
 *
 * 下载函数可以针对每个 URL 进行决定：
 * - 返回 null（这意味着 URL 应传递给模型）
 * - 下载资产并返回数据（包括重试、身份验证等）
 *
 * 如果下载失败，应该抛出 DownloadError。
 *
 * 应该返回按请求下载的顺序排序的对象数组。
 * 对于每个对象，如果下载了 URL，则数据应该是 Uint8Array。
 * 对于每个对象，mediaType 应是下载资源的媒体类型。
 * 对于每个对象，如果 URL 应按原样传递，则数据应为 null。
 */
export type DownloadFunction = (
  options: Array<{
    url: URL;
    isUrlSupportedByModel: boolean;
  }>,
) => PromiseLike<
  Array<{
    data: Uint8Array;
    mediaType: string | undefined;
  } | null>
>;

/**
 * 默认下载功能。
 * 如果模型不支持，则下载该文件。
 */
export const createDefaultDownloadFunction =
  (download: typeof originalDownload = originalDownload): DownloadFunction =>
  requestedDownloads =>
    Promise.all(
      requestedDownloads.map(async requestedDownload =>
        requestedDownload.isUrlSupportedByModel
          ? null
          : await download(requestedDownload),
      ),
    );
