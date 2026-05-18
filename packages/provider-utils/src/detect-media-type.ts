import { convertBase64ToUint8Array } from './uint8-utils';

const imageMediaTypeSignatures = [
  {
    mediaType: 'image/gif' as const,
    bytesPrefix: [0x47, 0x49, 0x46], // 动图
  },
  {
    mediaType: 'image/png' as const,
    bytesPrefix: [0x89, 0x50, 0x4e, 0x47], // 巴布亚新几内亚
  },
  {
    mediaType: 'image/jpeg' as const,
    bytesPrefix: [0xff, 0xd8], // JPEG
  },
  {
    mediaType: 'image/webp' as const,
    bytesPrefix: [
      0x52,
      0x49,
      0x46,
      0x46, // “即兴”
      null,
      null,
      null,
      null, // 文件大小（可变）
      0x57,
      0x45,
      0x42,
      0x50, // “网页”
    ],
  },
  {
    mediaType: 'image/bmp' as const,
    bytesPrefix: [0x42, 0x4d],
  },
  {
    mediaType: 'image/tiff' as const,
    bytesPrefix: [0x49, 0x49, 0x2a, 0x00],
  },
  {
    mediaType: 'image/tiff' as const,
    bytesPrefix: [0x4d, 0x4d, 0x00, 0x2a],
  },
  {
    mediaType: 'image/avif' as const,
    bytesPrefix: [
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66,
    ],
  },
  {
    mediaType: 'image/heic' as const,
    bytesPrefix: [
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    ],
  },
] as const;

const documentMediaTypeSignatures = [
  {
    mediaType: 'application/pdf' as const,
    bytesPrefix: [0x25, 0x50, 0x44, 0x46], // %PDF
  },
] as const;

const audioMediaTypeSignatures = [
  {
    mediaType: 'audio/mpeg' as const,
    bytesPrefix: [0xff, 0xfb],
  },
  {
    mediaType: 'audio/mpeg' as const,
    bytesPrefix: [0xff, 0xfa],
  },
  {
    mediaType: 'audio/mpeg' as const,
    bytesPrefix: [0xff, 0xf3],
  },
  {
    mediaType: 'audio/mpeg' as const,
    bytesPrefix: [0xff, 0xf2],
  },
  {
    mediaType: 'audio/mpeg' as const,
    bytesPrefix: [0xff, 0xe3],
  },
  {
    mediaType: 'audio/mpeg' as const,
    bytesPrefix: [0xff, 0xe2],
  },
  {
    mediaType: 'audio/wav' as const,
    bytesPrefix: [
      0x52, // R
      0x49, // I
      0x46, // F
      0x46, // F
      null,
      null,
      null,
      null,
      0x57, // W
      0x41, // A
      0x56, // V
      0x45, // E
    ],
  },
  {
    mediaType: 'audio/ogg' as const,
    bytesPrefix: [0x4f, 0x67, 0x67, 0x53],
  },
  {
    mediaType: 'audio/flac' as const,
    bytesPrefix: [0x66, 0x4c, 0x61, 0x43],
  },
  {
    mediaType: 'audio/aac' as const,
    bytesPrefix: [0x40, 0x15, 0x00, 0x00],
  },
  {
    mediaType: 'audio/mp4' as const,
    bytesPrefix: [0x66, 0x74, 0x79, 0x70],
  },
  {
    mediaType: 'audio/webm',
    bytesPrefix: [0x1a, 0x45, 0xdf, 0xa3],
  },
] as const;

const videoMediaTypeSignatures = [
  {
    mediaType: 'video/mp4' as const,
    bytesPrefix: [
      0x00,
      0x00,
      0x00,
      null,
      0x66,
      0x74,
      0x79,
      0x70, // ftyp
    ],
  },
  {
    mediaType: 'video/webm' as const,
    bytesPrefix: [0x1a, 0x45, 0xdf, 0xa3], // EBML
  },
  {
    mediaType: 'video/quicktime' as const,
    bytesPrefix: [
      0x00,
      0x00,
      0x00,
      0x14,
      0x66,
      0x74,
      0x79,
      0x70,
      0x71,
      0x74, // ftypqt
    ],
  },
  {
    mediaType: 'video/x-msvideo' as const,
    bytesPrefix: [0x52, 0x49, 0x46, 0x46], // 即兴演奏 (AVI)
  },
] as const;

const stripID3 = (data: Uint8Array | string) => {
  const bytes =
    typeof data === 'string' ? convertBase64ToUint8Array(data) : data;
  const id3Size =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);

  // 原始 MP3 从这里开始
  return bytes.slice(id3Size + 10);
};

function stripID3TagsIfPresent(data: Uint8Array | string): Uint8Array | string {
  const hasId3 =
    (typeof data === 'string' && data.startsWith('SUQz')) ||
    (typeof data !== 'string' &&
      data.length > 10 &&
      data[0] === 0x49 && // 'I'
      data[1] === 0x44 && // 'D'
      data[2] === 0x33); // '3'

  return hasId3 ? stripID3(data) : data;
}

type MediaTypeSignatures = ReadonlyArray<{
  readonly mediaType: string;
  readonly bytesPrefix: ReadonlyArray<number | null>;
}>;

function detectMediaTypeBySignatures<T extends MediaTypeSignatures>({
  data,
  signatures,
}: {
  data: Uint8Array | string;
  signatures: T;
}): T[number]['mediaType'] | undefined {
  const processedData = stripID3TagsIfPresent(data);

  // 转换前 ~18 个字节（24 个 base64 字符）以获得一致的检测逻辑：
  const bytes =
    typeof processedData === 'string'
      ? convertBase64ToUint8Array(
          processedData.substring(0, Math.min(processedData.length, 24)),
        )
      : processedData;

  for (const signature of signatures) {
    if (
      bytes.length >= signature.bytesPrefix.length &&
      signature.bytesPrefix.every(
        (byte, index) => byte === null || bytes[index] === byte,
      )
    ) {
      return signature.mediaType;
    }
  }

  return undefined;
}

const topLevelSignatureTables = {
  image: imageMediaTypeSignatures,
  audio: audioMediaTypeSignatures,
  video: videoMediaTypeSignatures,
  application: documentMediaTypeSignatures,
} as const;

type TopLevelMediaType = keyof typeof topLevelSignatureTables;

/**
 * 从文件的原始字节或 Base64 字符串检测文件的 IANA 媒体类型。
 *
 * - 当省略“topLevelType”时，将考虑每个已知的签名
 *   （图像、音频、视频和应用程序）。当
 *   字节与任何已知签名都不匹配。
 * - 当提供“topLevelType”时，仅对该顶级进行签名
 *   部分被考虑。对于不支持的段返回“未定义”
 *   （例如“文本”）或没有签名匹配时。
 */
export function detectMediaType({
  data,
  topLevelType,
}: {
  data: Uint8Array | string;
  topLevelType?: string;
}): string | undefined {
  if (topLevelType === undefined) {
    return detectMediaTypeBySignatures({
      data,
      signatures: [
        ...imageMediaTypeSignatures,
        ...documentMediaTypeSignatures,
        ...audioMediaTypeSignatures,
        ...videoMediaTypeSignatures,
      ],
    });
  }

  const signatures = topLevelSignatureTables[topLevelType as TopLevelMediaType];

  if (signatures === undefined) {
    return undefined;
  }

  return detectMediaTypeBySignatures({ data, signatures });
}

/**
 * 返回媒体类型的顶级段（“/”之前的部分）。
 *
 * 示例：
 *   - `"图像/png"` -> `"图像"`
 *   - `"图像/*"` -> `"图像"`
 *   - `“图像”` -> `“图像”`
 *   - `“图像/”` -> `“图像”`
 *   - `""` -> `""`
 *   - `"/"` -> `""`
 */
export function getTopLevelMediaType(mediaType: string): string {
  const slashIndex = mediaType.indexOf('/');
  return slashIndex === -1 ? mediaType : mediaType.substring(0, slashIndex);
}

/**
 * 仅当给定媒体类型具有非空、非通配符时才返回“true”
 * 子类型（即匹配形式“type/subtype”，并且“subtype”不是“*”）。
 *
 * 示例：
 *   - `"image/png"` -> `true`
 *   - `“图像/*”` -> `假`
 *   - `“图像”` -> `假`
 *   - `“图像/”` -> `假`
 *   - `""` -> `假`
 *   - `"/"` -> `假`
 */
export function isFullMediaType(mediaType: string): boolean {
  const slashIndex = mediaType.indexOf('/');
  if (slashIndex === -1) {
    return false;
  }
  const subtype = mediaType.substring(slashIndex + 1);
  return subtype.length > 0 && subtype !== '*';
}
