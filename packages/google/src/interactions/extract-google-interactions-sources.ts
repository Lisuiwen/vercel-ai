import type { LanguageModelV4Source } from '@ai-sdk/provider';
import type {
  GoogleInteractionsAnnotation,
  GoogleInteractionsBuiltinToolResultContent,
  GoogleInteractionsFileCitation,
  GoogleInteractionsGoogleMapsResultContent,
  GoogleInteractionsGoogleSearchResultContent,
  GoogleInteractionsPlaceCitation,
  GoogleInteractionsURLCitation,
  GoogleInteractionsURLContextResultContent,
} from './google-interactions-prompt';

const KNOWN_DOC_EXTENSIONS: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function inferDocMediaType(uriOrName: string): string {
  const lower = uriOrName.toLowerCase();
  for (const [ext, media] of Object.entries(KNOWN_DOC_EXTENSIONS)) {
    if (lower.endsWith(`.${ext}`)) return media;
  }
  return 'application/octet-stream';
}

function basename(uriOrName: string): string | undefined {
  const parts = uriOrName.split('/');
  const last = parts[parts.length - 1];
  return last && last.length > 0 ? last : undefined;
}

/**
 * 映射单个文本块注释（`url_引用`/`file_引用`/
 * `place_itation`) 到 `LanguageModelV4Source` 上。返回“未定义”时
 * 注释缺少形成源的最小有效负载（例如 URL
 * 没有“url”的引用）。
 */
export function annotationToSource({
  annotation,
  generateId,
}: {
  annotation: GoogleInteractionsAnnotation | { type: string };
  generateId: () => string;
}): LanguageModelV4Source | undefined {
  switch (annotation.type) {
    case 'url_citation': {
      const a = annotation as GoogleInteractionsURLCitation;
      if (a.url == null || a.url.length === 0) return undefined;
      return {
        type: 'source',
        sourceType: 'url',
        id: generateId(),
        url: a.url,
        ...(a.title != null ? { title: a.title } : {}),
      };
    }
    case 'file_citation': {
      const a = annotation as GoogleInteractionsFileCitation;
      const uri = a.url ?? a.document_uri ?? a.file_name;
      if (uri == null || uri.length === 0) return undefined;
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return {
          type: 'source',
          sourceType: 'url',
          id: generateId(),
          url: uri,
          ...(a.file_name != null ? { title: a.file_name } : {}),
        };
      }
      const filename = a.file_name ?? basename(uri);
      const mediaType = inferDocMediaType(uri);
      return {
        type: 'source',
        sourceType: 'document',
        id: generateId(),
        mediaType,
        title: a.file_name ?? filename ?? uri,
        ...(filename != null ? { filename } : {}),
      };
    }
    case 'place_citation': {
      const a = annotation as GoogleInteractionsPlaceCitation;
      if (a.url == null || a.url.length === 0) return undefined;
      return {
        type: 'source',
        sourceType: 'url',
        id: generateId(),
        url: a.url,
        ...(a.name != null ? { title: a.name } : {}),
      };
    }
    default:
      return undefined;
  }
}

/**
 * 将内置工具*结果*内容块映射到零个或多个
 * `LanguageModelV4Source` 部分。 Interactions API 暴露了接地点
 * 内联来源（通过“text_annotation”增量）和工具结果
 * 内容块；后者是该函数所消耗的。
 *
 * 支持的结果类型：
 * - `url_context_result` -> 每个获取的 URL 的 URL 源，具有 `status: 'success'`
 * - `google_search_result` -> URL 来源（当存在 `url` 时），搜索建议
 *                              条目被跳过（它们是 HTML 小部件，而不是引用）
 * - `google_maps_result` -> 每个带有 `url` 的地点的 URL 来源
 * - `file_search_result` -> 文档源（尽力而为 - `result[]` 是松散类型的）
 */
export function builtinToolResultToSources({
  block,
  generateId,
}: {
  block: GoogleInteractionsBuiltinToolResultContent;
  generateId: () => string;
}): Array<LanguageModelV4Source> {
  const sources: Array<LanguageModelV4Source> = [];

  switch (block.type) {
    case 'url_context_result': {
      const result =
        (block as GoogleInteractionsURLContextResultContent).result ?? [];
      for (const entry of result) {
        if (entry?.url == null || entry.url.length === 0) continue;
        if (entry.status != null && entry.status !== 'success') continue;
        sources.push({
          type: 'source',
          sourceType: 'url',
          id: generateId(),
          url: entry.url,
        });
      }
      break;
    }
    case 'google_search_result': {
      const result =
        (block as GoogleInteractionsGoogleSearchResultContent).result ?? [];
      for (const entry of result) {
        const url = entry?.url;
        if (url == null || url.length === 0) continue;
        sources.push({
          type: 'source',
          sourceType: 'url',
          id: generateId(),
          url,
          ...(entry.title != null ? { title: entry.title } : {}),
        });
      }
      break;
    }
    case 'google_maps_result': {
      const result =
        (block as GoogleInteractionsGoogleMapsResultContent).result ?? [];
      for (const entry of result) {
        for (const place of entry.places ?? []) {
          if (place.url == null || place.url.length === 0) continue;
          sources.push({
            type: 'source',
            sourceType: 'url',
            id: generateId(),
            url: place.url,
            ...(place.name != null ? { title: place.name } : {}),
          });
        }
      }
      break;
    }
    case 'file_search_result': {
      const result = (block as { result?: Array<unknown> }).result ?? [];
      for (const raw of result) {
        if (raw == null || typeof raw !== 'object') continue;
        const entry = raw as {
          file_name?: string;
          document_uri?: string;
          url?: string;
          title?: string;
        };
        const uri = entry.url ?? entry.document_uri ?? entry.file_name;
        if (uri == null || uri.length === 0) continue;
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
          sources.push({
            type: 'source',
            sourceType: 'url',
            id: generateId(),
            url: uri,
            ...(entry.title != null ? { title: entry.title } : {}),
          });
          continue;
        }
        const filename = entry.file_name ?? basename(uri);
        const mediaType = inferDocMediaType(uri);
        sources.push({
          type: 'source',
          sourceType: 'document',
          id: generateId(),
          mediaType,
          title: entry.title ?? entry.file_name ?? filename ?? uri,
          ...(filename != null ? { filename } : {}),
        });
      }
      break;
    }
    default:
      break;
  }

  return sources;
}

/**
 * 给定附加到单个“文本”内容块的注释列表，
 * 返回相应的“LanguageModelV4Source”部分（通过删除重复
 * URL/文件名以避免相同引文再次出现时重复计算
 * 跨越三角洲）。
 */
export function annotationsToSources({
  annotations,
  generateId,
}: {
  annotations:
    | Array<GoogleInteractionsAnnotation | { type: string }>
    | null
    | undefined;
  generateId: () => string;
}): Array<LanguageModelV4Source> {
  if (annotations == null) return [];
  const seen = new Set<string>();
  const sources: Array<LanguageModelV4Source> = [];
  for (const annotation of annotations) {
    const source = annotationToSource({ annotation, generateId });
    if (source == null) continue;
    const key =
      source.sourceType === 'url'
        ? `url:${source.url}`
        : `doc:${source.filename ?? source.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push(source);
  }
  return sources;
}
