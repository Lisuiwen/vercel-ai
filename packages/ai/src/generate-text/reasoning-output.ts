import type {
  DataContent,
  ReasoningFilePart,
  ReasoningPart,
} from '@ai-sdk/provider-utils';
import type { ProviderMetadata } from '../types/provider-metadata';
import { DefaultGeneratedFile, type GeneratedFile } from './generated-file';

function unwrapReasoningFileData(
  data: ReasoningFilePart['data'],
): DataContent | URL {
  if (typeof data === 'object' && data !== null && 'type' in data) {
    return data.type === 'data' ? data.data : data.url;
  }
  return data;
}

/**
 * 文本生成的推理输出。其中包含一个推理。
 */
export interface ReasoningOutput {
  type: 'reasoning';

  /**
   * 推理文本。
   */
  text: string;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从AI SDK发送给成功并实现特定的成功
   * 可以完全封装在提供者中的功能。
   */
  providerMetadata?: ProviderMetadata;
}

/**
 * 文本生成的推理文件输出。
 * 它包含作为推理的一部分生成的文件。
 */
export interface ReasoningFileOutput {
  type: 'reasoning-file';

  /**
   * 生成的文件。
   */
  file: GeneratedFile;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从AI SDK发送给成功并实现特定的成功
   * 可以完全封装在提供者中的功能。
   */
  providerMetadata?: ProviderMetadata;
}

export function convertFromReasoningOutputs(
  parts: Array<ReasoningOutput | ReasoningFileOutput>,
): Array<ReasoningPart | ReasoningFilePart> {
  return parts.map(part => {
    if (part.type === 'reasoning') {
      return {
        type: 'reasoning' as const,
        text: part.text,
        ...(part.providerMetadata != null
          ? { providerOptions: part.providerMetadata }
          : {}),
      };
    }

    return {
      type: 'reasoning-file' as const,
      data: part.file.base64,
      mediaType: part.file.mediaType,
      ...(part.providerMetadata != null
        ? { providerOptions: part.providerMetadata }
        : {}),
    };
  });
}

export function convertToReasoningOutputs(
  parts: Array<ReasoningPart | ReasoningFilePart>,
): Array<ReasoningOutput | ReasoningFileOutput> {
  return parts.map(part => {
    if (part.type === 'reasoning') {
      return {
        type: 'reasoning' as const,
        text: part.text,
        ...(part.providerOptions != null
          ? { providerMetadata: part.providerOptions as ProviderMetadata }
          : {}),
      };
    }

    const rawData = unwrapReasoningFileData(part.data);

    const fileData: string | Uint8Array =
      rawData instanceof ArrayBuffer
        ? new Uint8Array(rawData)
        : rawData instanceof URL
          ? rawData.toString()
          : (rawData as string | Uint8Array);

    return {
      type: 'reasoning-file' as const,
      file: new DefaultGeneratedFile({
        data: fileData,
        mediaType: part.mediaType,
      }),
      ...(part.providerOptions != null
        ? { providerMetadata: part.providerOptions as ProviderMetadata }
        : {}),
    };
  });
}
