import { download as originalDownload } from './download';

/**
 * 实验性的。可以在没有警告的情况下更改补丁版本。
 *
 * 下载功能。使用URL存储和指示的布尔值进行调用
 * 该URL是否受模型支持。
 *
 * 下载函数可以针对每个URL进行决定：
 * - 返回null（即URL应交模型）
 * - 下载资产并返回数据（包括重试、身份验证等）
 *
 * 如果下载失败，应该抛出DownloadError。
 *
 * 应该返回按请求下载的顺序排序的对象数组。
 * 对于每个对象，如果下载了URL，则数据应该是Uint8Array。
 * 对于每个对象，mediaType应是下载资源的媒体类型。
 * 对于每个对象，如果URL应按原样提交，则数据应为空。
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
