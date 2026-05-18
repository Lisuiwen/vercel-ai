import type {
  LanguageModelV4FilePart,
  LanguageModelV4Message,
  LanguageModelV4Prompt,
  LanguageModelV4TextPart,
  LanguageModelV4ToolResultOutput,
} from '@ai-sdk/provider';
import {
  asArray,
  detectMediaType,
  isFullMediaType,
  isUrlSupported,
  type CustomPart,
  type FilePart,
  type ImagePart,
  type ModelMessage,
  type ReasoningFilePart,
  type ReasoningPart,
  type TextPart,
  type ToolCallPart,
  type ToolResultOutput,
  type ToolResultPart,
} from '@ai-sdk/provider-utils';
import {
  createDefaultDownloadFunction,
  type DownloadFunction,
} from '../util/download/download-function';
import { convertToLanguageModelV4FilePart } from './file-part-data';
import { logWarnings } from '../logger/log-warnings';
import type { Warning } from '../types/warning';
import { InvalidMessageRoleError } from './invalid-message-role-error';
import type { StandardizedPrompt } from './standardize-prompt';
import { MissingToolResultsError } from '../error/missing-tool-result-error';

export async function convertToLanguageModelPrompt({
  prompt,
  supportedUrls,
  download = createDefaultDownloadFunction(),
  // 这里仅需要“provider”来通过“mapToolResultOutput”转换旧工具输出类型。
  // TODO：在 v8 中删除“file-id”和“image-file-id”类型时删除
  provider,
}: {
  prompt: StandardizedPrompt;
  supportedUrls: Record<string, RegExp[]>;
  download: DownloadFunction | undefined;
  provider?: string;
}): Promise<LanguageModelV4Prompt> {
  const downloadedAssets = await downloadAssets(
    prompt.messages,
    download,
    supportedUrls,
  );

  const approvalIdToToolCallId = new Map<string, string>();
  for (const message of prompt.messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (
          part.type === 'tool-approval-request' &&
          'approvalId' in part &&
          'toolCallId' in part
        ) {
          approvalIdToToolCallId.set(
            part.approvalId as string,
            part.toolCallId as string,
          );
        }
      }
    }
  }

  const approvedToolCallIds = new Set<string>();
  for (const message of prompt.messages) {
    if (message.role === 'tool') {
      for (const part of message.content) {
        if (part.type === 'tool-approval-response') {
          const toolCallId = approvalIdToToolCallId.get(part.approvalId);
          if (toolCallId) {
            approvedToolCallIds.add(toolCallId);
          }
        }
      }
    }
  }

  const messages = [
    ...(prompt.instructions != null
      ? typeof prompt.instructions === 'string'
        ? [{ role: 'system' as const, content: prompt.instructions }]
        : asArray(prompt.instructions).map(message => ({
            role: 'system' as const,
            content: message.content,
            providerOptions: message.providerOptions,
          }))
      : []),
    ...prompt.messages.map(message =>
      convertToLanguageModelMessage({ message, downloadedAssets, provider }),
    ),
  ];

  // 将连续的工具消息合并为单个工具消息
  const combinedMessages = [];
  for (const message of messages) {
    if (message.role !== 'tool') {
      combinedMessages.push(message);
      continue;
    }

    const lastCombinedMessage = combinedMessages.at(-1);
    if (lastCombinedMessage?.role === 'tool') {
      lastCombinedMessage.content.push(...message.content);
    } else {
      combinedMessages.push(message);
    }
  }

  const toolCallIds = new Set<string>();

  for (const message of combinedMessages) {
    switch (message.role) {
      case 'assistant': {
        for (const content of message.content) {
          if (content.type === 'tool-call' && !content.providerExecuted) {
            toolCallIds.add(content.toolCallId);
          }
        }
        break;
      }
      case 'tool': {
        for (const content of message.content) {
          if (content.type === 'tool-result') {
            toolCallIds.delete(content.toolCallId);
          }
        }
        break;
      }
      case 'user':
      case 'system':
        // 在检查之前从集合中删除批准的工具调用：
        for (const id of approvedToolCallIds) {
          toolCallIds.delete(id);
        }

        if (toolCallIds.size > 0) {
          throw new MissingToolResultsError({
            toolCallIds: Array.from(toolCallIds),
          });
        }
        break;
    }
  }

  // 在检查之前从集合中删除批准的工具调用：
  for (const id of approvedToolCallIds) {
    toolCallIds.delete(id);
  }

  if (toolCallIds.size > 0) {
    throw new MissingToolResultsError({ toolCallIds: Array.from(toolCallIds) });
  }

  return combinedMessages.filter(
    // 过滤掉空工具消息（例如，如果它们仅包含
    // 已删除的工具批准响应部分）。
    // 这可以防止向提供者发送无效的空消息。
    // 注意：提供商执行的工具批准响应部分将被保留。
    message => message.role !== 'tool' || message.content.length > 0,
  );
}

/**
 * 将 ModelMessage 转换为 LanguageModelV4Message。
 *
 * @param message - The ModelMessage to convert.
 * @param downloadedAssets - A map of URLs to their downloaded data. Only
 * 如果模型不支持 URL，则可用，否则为 null。
 */
export function convertToLanguageModelMessage({
  message,
  downloadedAssets,
  // 这里仅需要“provider”来通过“mapToolResultOutput”转换旧工具输出类型。
  // TODO：在 v8 中删除“file-id”和“image-file-id”类型时删除
  provider,
}: {
  message: ModelMessage;
  downloadedAssets: Record<
    string,
    { mediaType: string | undefined; data: Uint8Array }
  >;
  provider?: string;
}): LanguageModelV4Message {
  const warnings: Warning[] = [];

  const role = message.role;
  switch (role) {
    case 'system': {
      return {
        role: 'system',
        content: message.content,
        providerOptions: message.providerOptions,
      };
    }

    case 'user': {
      if (typeof message.content === 'string') {
        return {
          role: 'user',
          content: [{ type: 'text', text: message.content }],
          providerOptions: message.providerOptions,
        };
      }

      const converted = {
        role: 'user' as const,
        content: message.content
          .map(part => {
            if (part.type === 'image') {
              warnings.push({
                type: 'deprecated',
                setting: '"image" content part',
                message: `The "image" content part type is deprecated. Use a "file" part with mediaType: 'image' (or a more specific image/* subtype) instead.`,
              });
            }
            return convertImagePartToFilePart(part);
          })
          .map(part => convertPartToLanguageModelPart(part, downloadedAssets))
          // 删除空文本部分：
          .filter(part => part.type !== 'text' || part.text !== ''),
        providerOptions: message.providerOptions,
      };
      if (warnings.length > 0) {
        logWarnings({ warnings });
      }
      return converted;
    }

    case 'assistant': {
      if (typeof message.content === 'string') {
        return {
          role: 'assistant',
          content: [{ type: 'text', text: message.content }],
          providerOptions: message.providerOptions,
        };
      }

      const converted = {
        role: 'assistant' as const,
        content: message.content
          .filter(
            // 删除空文本部分（没有文本，也没有提供程序选项）：
            part =>
              part.type !== 'text' ||
              part.text !== '' ||
              part.providerOptions != null,
          )
          .filter(
            (
              part,
            ): part is
              | CustomPart
              | TextPart
              | FilePart
              | ReasoningPart
              | ReasoningFilePart
              | ToolCallPart
              | ToolResultPart => part.type !== 'tool-approval-request',
          )
          .map(part => {
            const providerOptions = part.providerOptions;

            switch (part.type) {
              case 'custom': {
                return {
                  type: 'custom' as const,
                  kind: part.kind,
                  providerOptions,
                };
              }
              case 'file': {
                const { data, mediaType } = convertToLanguageModelV4FilePart(
                  part.data,
                );
                return {
                  type: 'file' as const,
                  data,
                  filename: part.filename,
                  mediaType: mediaType ?? part.mediaType,
                  providerOptions,
                };
              }
              case 'reasoning': {
                return {
                  type: 'reasoning' as const,
                  text: part.text,
                  providerOptions,
                };
              }
              case 'reasoning-file': {
                const { data, mediaType } = convertToLanguageModelV4FilePart(
                  part.data,
                );
                if (data.type !== 'data' && data.type !== 'url') {
                  throw new Error(
                    `Unsupported reasoning-file data type: ${data.type}`,
                  );
                }
                return {
                  type: 'reasoning-file' as const,
                  data,
                  mediaType: mediaType ?? part.mediaType,
                  providerOptions,
                };
              }
              case 'text': {
                return {
                  type: 'text' as const,
                  text: part.text,
                  providerOptions,
                };
              }
              case 'tool-call': {
                return {
                  type: 'tool-call' as const,
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  input: part.input,
                  providerExecuted: part.providerExecuted,
                  providerOptions,
                };
              }
              case 'tool-result': {
                return {
                  type: 'tool-result' as const,
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  output: mapToolResultOutput({
                    output: part.output,
                    provider,
                    warnings,
                    downloadedAssets,
                  }),
                  providerOptions,
                };
              }
            }
          }),
        providerOptions: message.providerOptions,
      };
      if (warnings.length > 0) {
        logWarnings({ warnings });
      }
      return converted;
    }

    case 'tool': {
      const converted = {
        role: 'tool' as const,
        content: message.content
          .filter(
            // 仅包含提供商执行的工具的工具批准响应
            part =>
              part.type !== 'tool-approval-response' || part.providerExecuted,
          )
          .map(part => {
            switch (part.type) {
              case 'tool-result': {
                return {
                  type: 'tool-result' as const,
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  output: mapToolResultOutput({
                    output: part.output,
                    provider,
                    warnings,
                    downloadedAssets,
                  }),
                  providerOptions: part.providerOptions,
                };
              }
              case 'tool-approval-response': {
                return {
                  type: 'tool-approval-response' as const,
                  approvalId: part.approvalId,
                  approved: part.approved,
                  reason: part.reason,
                };
              }
            }
          }),
        providerOptions: message.providerOptions,
      };
      if (warnings.length > 0) {
        logWarnings({ warnings });
      }
      return converted;
    }

    default: {
      const _exhaustiveCheck: never = role;
      throw new InvalidMessageRoleError({ role: _exhaustiveCheck });
    }
  }
}

/*
 * 将旧版“ImagePart”重写为等效的“FilePart”。默认
 * 裸露的“ImagePart”（无“mediaType”）的“mediaType”是“image”（顶级
 * 段）；显式的“mediaType”是逐字传递的。在此之后
 * 预传递，只有“TextPart”和“FilePart”到达面向提供者的
 * 转换逻辑。
 */
function convertImagePartToFilePart(
  part: TextPart | ImagePart | FilePart,
): TextPart | FilePart {
  if (part.type !== 'image') {
    return part;
  }
  return {
    type: 'file',
    data: part.image,
    mediaType: part.mediaType ?? 'image',
    providerOptions: part.providerOptions,
  };
}

/**
 * 从用户消息中的 URL 下载文件。
 */
async function downloadAssets(
  messages: ModelMessage[],
  download: DownloadFunction,
  supportedUrls: Record<string, RegExp[]>,
): Promise<
  Record<string, { mediaType: string | undefined; data: Uint8Array }>
> {
  type ConvertedFile = {
    mediaType: string | undefined;
    data: LanguageModelV4FilePart['data'];
  };
  type UrlTaggedFile = {
    mediaType: string | undefined;
    data: { type: 'url'; url: URL };
  };

  const downloadableFiles: FilePart[] = [];

  for (const message of messages) {
    if (message.role === 'user' && Array.isArray(message.content)) {
      for (const part of message.content) {
        const filePart = convertImagePartToFilePart(part);

        if (filePart.type === 'file') {
          downloadableFiles.push(filePart);
        }
      }
    }

    if (message.role === 'tool') {
      for (const part of message.content) {
        if (part.type !== 'tool-result') {
          continue;
        }

        if (part.output.type !== 'content') {
          continue;
        }

        for (const contentPart of part.output.value) {
          if (contentPart.type === 'file') {
            downloadableFiles.push(contentPart);
          }
        }
      }
    }

    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type !== 'tool-result') {
          continue;
        }
        if (part.output.type !== 'content') {
          continue;
        }
        for (const contentPart of part.output.value) {
          if (contentPart.type === 'file') {
            downloadableFiles.push(contentPart);
          }
        }
      }
    }
  }

  const plannedDownloads = downloadableFiles
    .map((part): ConvertedFile => {
      const mediaType = part.mediaType;
      const { data } = convertToLanguageModelV4FilePart(part.data);
      return { mediaType, data };
    })
    .filter((part): part is UrlTaggedFile => part.data.type === 'url')
    .map(part => ({
      url: part.data.url,
      isUrlSupportedByModel:
        part.mediaType != null &&
        isUrlSupported({
          url: part.data.url.toString(),
          mediaType: part.mediaType,
          supportedUrls,
        }),
    }));
  // 并行下载：
  const downloadedFiles = await download(plannedDownloads);

  return Object.fromEntries(
    downloadedFiles
      .map((file, index) =>
        file == null
          ? null
          : [
              plannedDownloads[index].url.toString(),
              { data: file.data, mediaType: file.mediaType },
            ],
      )
      .filter(file => file != null),
  );
}

/**
 * 将部分用户消息转换为 LanguageModelV4Part。
 *
 * @param part - The part to convert.
 * @param downloadedAssets - A map of URLs to their downloaded data. Only
 * 如果模型不支持 URL，则可用，否则为 null。
 * @returns The converted part.
 */
function convertPartToLanguageModelPart(
  part: TextPart | FilePart,
  downloadedAssets: Record<
    string,
    { mediaType: string | undefined; data: Uint8Array }
  >,
): LanguageModelV4TextPart | LanguageModelV4FilePart {
  if (part.type === 'text') {
    return {
      type: 'text',
      text: part.text,
      providerOptions: part.providerOptions,
    };
  }

  const { data: normalizedData, mediaType: dataUrlMediaType } =
    convertToLanguageModelV4FilePart(part.data);

  let mediaType: string | undefined = dataUrlMediaType ?? part.mediaType;
  let data: LanguageModelV4FilePart['data'] = normalizedData;

  if (data.type === 'url') {
    const downloadedFile = downloadedAssets[data.url.toString()];
    if (downloadedFile) {
      data = { type: 'data', data: downloadedFile.data };
      if (
        downloadedFile.mediaType != null &&
        (mediaType == null || !isFullMediaType(mediaType))
      ) {
        mediaType = downloadedFile.mediaType;
      }
    }
  }

  if (
    data.type === 'data' &&
    (data.data instanceof Uint8Array || typeof data.data === 'string')
  ) {
    const imageMediaType = detectMediaType({
      data: data.data,
      topLevelType: 'image',
    });
    if (imageMediaType != null) {
      mediaType = imageMediaType;
    }
  }

  if (mediaType == null) {
    throw new Error(`Media type is missing for file part`);
  }

  return {
    type: 'file',
    mediaType,
    filename: part.filename,
    data,
    providerOptions: part.providerOptions,
  };
}

function mapToolResultOutput({
  output,
  // 此处仅需要“provider”将旧的“file-id”和“image-file-id”类型转换为提供程序引用（以防它们使用字符串 ID 值）。
  // TODO：在 v8 中删除“file-id”和“image-file-id”类型时删除
  provider,
  warnings = [],
  downloadedAssets,
}: {
  output: ToolResultOutput;
  provider?: string;
  warnings?: Warning[];
  downloadedAssets: Record<
    string,
    { mediaType: string | undefined; data: Uint8Array }
  >;
}): LanguageModelV4ToolResultOutput {
  if (output.type !== 'content') {
    return output;
  }

  return {
    type: 'content',
    value: output.value.map(item => {
      switch (item.type) {
        case 'file': {
          const convertedPart = convertPartToLanguageModelPart(
            item,
            downloadedAssets,
          );

          if (convertedPart.type !== 'file') {
            throw new Error(
              'Expected tool result file content to convert to file.',
            );
          }

          return convertedPart;
        }
        case 'file-data': {
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "file-data"',
            message: `The "file-data" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'data', data } instead.`,
          });
          return {
            type: 'file' as const,
            data: { type: 'data' as const, data: item.data },
            filename: item.filename,
            mediaType: item.mediaType,
            providerOptions: item.providerOptions,
          };
        }
        case 'file-url': {
          const mediaType = item.mediaType ?? getMediaTypeFromUrl(item.url);
          let message = `The "file-url" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'url', url } instead.`;
          if (!item.mediaType) {
            const inferenceSuffix =
              mediaType === 'application/octet-stream'
                ? `Unable to infer media type from URL. Defaulting to 'application/octet-stream'.`
                : `Inferred media type '${mediaType}' from URL.`;
            message = `The "file-url" tool result content part with URL "${item.url}" is missing a "mediaType". ${inferenceSuffix} ${message}`;
          }
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "file-url"',
            message,
          });
          return {
            type: 'file' as const,
            data: { type: 'url' as const, url: new URL(item.url) },
            mediaType,
            providerOptions: item.providerOptions,
          };
        }
        case 'file-id': {
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "file-id"',
            message: `The "file-id" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`,
          });
          return {
            type: 'file' as const,
            data: {
              type: 'reference' as const,
              reference: convertFileIdToProviderReference({
                fileId: item.fileId,
                provider,
              }),
            },
            mediaType: 'application',
            providerOptions: item.providerOptions,
          };
        }
        case 'file-reference': {
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "file-reference"',
            message: `The "file-reference" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`,
          });
          return {
            type: 'file' as const,
            data: {
              type: 'reference' as const,
              reference: item.providerReference,
            },
            mediaType: 'application',
            providerOptions: item.providerOptions,
          };
        }
        // “image-*”类型是旧的且已弃用。
        // TODO：删除 v8 中的迁移并结合从提供程序实用程序中删除这些类型。
        case 'image-data': {
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "image-data"',
            message: `The "image-data" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'data', data } instead.`,
          });
          return {
            type: 'file' as const,
            data: { type: 'data' as const, data: item.data },
            mediaType: item.mediaType,
            providerOptions: item.providerOptions,
          };
        }
        case 'image-url': {
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "image-url"',
            message: `The "image-url" type for tool result content is deprecated. Use the "file" type with mediaType 'image' (or a specific image/* subtype) and { type: 'url', url } instead.`,
          });
          return {
            type: 'file' as const,
            data: { type: 'url' as const, url: new URL(item.url) },
            mediaType: 'image',
            providerOptions: item.providerOptions,
          };
        }
        case 'image-file-id': {
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "image-file-id"',
            message: `The "image-file-id" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`,
          });
          return {
            type: 'file' as const,
            data: {
              type: 'reference' as const,
              reference: convertFileIdToProviderReference({
                fileId: item.fileId,
                provider,
              }),
            },
            mediaType: 'image',
            providerOptions: item.providerOptions,
          };
        }
        case 'image-file-reference': {
          warnings.push({
            type: 'deprecated',
            setting: '"tool-result" content of type "image-file-reference"',
            message: `The "image-file-reference" type for tool result content is deprecated. Use the "file" type with mediaType and { type: 'reference', reference } instead.`,
          });
          return {
            type: 'file' as const,
            data: {
              type: 'reference' as const,
              reference: item.providerReference,
            },
            mediaType: 'image',
            providerOptions: item.providerOptions,
          };
        }
        default:
          return item;
      }
    }),
  };
}

function convertFileIdToProviderReference({
  fileId,
  provider,
}: {
  fileId: string | Record<string, string>;
  provider?: string;
}): Record<string, string> {
  if (typeof fileId === 'object') {
    return fileId;
  }

  if (provider == null) {
    throw new Error(
      'Cannot convert string fileId to provider reference without a provider ID. ' +
        'Use a Record<string, string> fileId or switch to the file-reference type.',
    );
  }

  return { [provider]: fileId };
}

// 临时私人帮手（见下文）。
const URL_EXTENSION_TO_MEDIA_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  heic: 'image/heic',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
};

/*
 * 尝试从 URL 中的文件扩展名推断 IANA 媒体类型
 * 路径名。当扩展不存在时返回“fallbackMediaType”，
 * 无法识别，或者无法解析 URL。
 *
 * 临时私人助手作为“file-url”内容部分上缺少媒体类型的最佳解决方案。
 */
function getMediaTypeFromUrl(
  url: string,
  fallbackMediaType = 'application/octet-stream',
): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext && Object.hasOwn(URL_EXTENSION_TO_MEDIA_TYPE, ext)) {
      return URL_EXTENSION_TO_MEDIA_TYPE[ext];
    }
  } catch {
    // 忽略 URL 解析错误
  }
  return fallbackMediaType;
}
