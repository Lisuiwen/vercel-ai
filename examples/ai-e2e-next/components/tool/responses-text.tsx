'use client';

import { Response } from '@/components/ai-elements/response';
import type { OpenaiResponsesTextProviderMetadata } from '@ai-sdk/openai';
import type { AzureResponsesTextProviderMetadata } from '@ai-sdk/azure';
import type { TextUIPart } from 'ai';

type ResponsesOutputTextProviderMetadata =
  | OpenaiResponsesTextProviderMetadata
  | AzureResponsesTextProviderMetadata;

function extractProviderAndAnnotations(
  providerMetadata: ResponsesOutputTextProviderMetadata,
) {
  if ('openai' in providerMetadata) {
    return {
      provider: 'openai',
      itemId: providerMetadata.openai.itemId,
      annotations: providerMetadata.openai.annotations,
    } as const;
  }
  if ('azure' in providerMetadata) {
    return {
      provider: 'azure',
      itemId: providerMetadata.azure.itemId,
      annotations: providerMetadata.azure.annotations,
    } as const;
  }
  // never
  const _exhaustive: never = providerMetadata;
  return _exhaustive;
}

export function ResponsesText({ part }: { part: TextUIPart }) {
  if (!part.providerMetadata) return <Response>{part.text}</Response>;

  const providerMetadata = part.providerMetadata as
    | ResponsesOutputTextProviderMetadata
    | undefined;

  if (!providerMetadata) return <Response>{part.text}</Response>;

  const {
    provider, // 'openai' 或 'azure'
    itemId: _,
    annotations,
  } = extractProviderAndAnnotations(providerMetadata);

  if (!annotations) return <Response>{part.text}</Response>;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // 按 start_index 降序排序 annotations，从末尾向开头处理。
  // 确保字符串修改不会使较早 annotation 的索引失效。
  const sortedAnnotations = [...annotations].sort((a, b) => {
    const aStart = 'start_index' in a ? a.start_index : -1;
    const bStart = 'start_index' in b ? b.start_index : -1;
    return bStart - aStart;
  });

  const text = sortedAnnotations.reduce<string>((acc, cur) => {
    const text = (() => {
      switch (cur.type) {
        case 'url_citation': {
          // Markdown 转换时通常无需替换这些字符串。
          return acc;
        }
        case 'file_citation': {
          return acc;
        }
        case 'container_file_citation': {
          // 替换为可下载文件的 URL。
          if (cur.start_index === 0 && cur.end_index === 0) return acc;
          return (
            acc.slice(0, cur.start_index) +
            `${baseUrl}/api/download-container-file/${provider}?container_id=${encodeURIComponent(cur.container_id)}&file_id=${encodeURIComponent(cur.file_id)}&filename=${encodeURIComponent(cur.filename)}` +
            acc.slice(cur.end_index)
          );
        }
        case 'file_path': {
          return acc;
        }
        default: {
          const _exhaustive: never = cur;
          return _exhaustive;
        }
      }
    })();
    return text;
  }, part.text);

  return <Response>{text}</Response>;
}
