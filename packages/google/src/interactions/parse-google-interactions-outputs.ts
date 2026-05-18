import type { JSONValue, LanguageModelV4Content } from '@ai-sdk/provider';
import type { GoogleInteractionsStep } from './google-interactions-api';
import {
  annotationsToSources,
  builtinToolResultToSources,
} from './extract-google-interactions-sources';
import type {
  GoogleInteractionsAnnotation,
  GoogleInteractionsBuiltinToolResultContent,
} from './google-interactions-prompt';

export type ParseGoogleInteractionsOutputsResult = {
  content: Array<LanguageModelV4Content>;
  hasFunctionCall: boolean;
};

/*
 * 为输出部分构建“providerMetadata.google”有效负载，以便
 * 下一回合的交互转换器可以读取每一步
 * `signature` （往返）和父级 `interactionId` （历史压缩
 * 在“previousInteractionId”下）。
 */
function googleProviderMetadata({
  signature,
  interactionId,
}: {
  signature?: string | null;
  interactionId?: string;
}): { providerMetadata: { google: Record<string, string> } } | object {
  const google: Record<string, string> = {};
  if (signature != null) {
    google.signature = signature;
  }
  if (interactionId != null) {
    google.interactionId = interactionId;
  }
  return Object.keys(google).length > 0 ? { providerMetadata: { google } } : {};
}

const BUILTIN_TOOL_CALL_TYPES = new Set([
  'google_search_call',
  'code_execution_call',
  'url_context_call',
  'file_search_call',
  'google_maps_call',
  'mcp_server_tool_call',
]);

const BUILTIN_TOOL_RESULT_TYPES = new Set([
  'google_search_result',
  'code_execution_result',
  'url_context_result',
  'file_search_result',
  'google_maps_result',
  'mcp_server_tool_result',
]);

function builtinToolNameFromCallType(type: string): string {
  return type.replace(/_call$/, '');
}

function builtinToolNameFromResultType(type: string): string {
  return type.replace(/_result$/, '');
}

/**
 * 遍历交互响应的“steps[]”数组并发出 AI SDK
 * `LanguageModelV4Content[]`。表面：
 *
 * - `model_output` 步骤：为 `text` 迭代 `step.content[]`（使用
 *   注释 → 源部分）和“图像”内容块。
 * - `thought` 步骤：从 `summary[*]` 发出单个 `reasoning` 部分。
 * - `function_call` 步骤：直接发出 `tool-call` 部分。
 * - 内置工具“*_call”/“*_result”步骤（Google 搜索、代码执行、
 *   URL 上下文、文件搜索、Google 地图、MCP 服务器）：发出
 *   `tool-call`/`tool-result` 与 `providerExecuted: true` 部分。
 * - 跳过“user_input”步骤（它们回显客户端的输入）。
 */
export function parseGoogleInteractionsOutputs({
  steps,
  generateId,
  interactionId,
}: {
  steps: Array<GoogleInteractionsStep> | null | undefined;
  generateId: () => string;
  /**
   * 响应中的顶级“Interaction.id”。印在每个输出上
   * 部分的“providerMetadata.google.interactionId”，以便转换器可以删除
   * 当使用“previousInteractionId”时，匹配助手就会转动
   * 下一轮（压实）。
   */
  interactionId?: string;
}): ParseGoogleInteractionsOutputsResult {
  const content: Array<LanguageModelV4Content> = [];
  let hasFunctionCall = false;

  if (steps == null) {
    return { content, hasFunctionCall };
  }

  for (const step of steps) {
    if (step == null || typeof step !== 'object') continue;
    const type = (step as { type?: string }).type;
    if (typeof type !== 'string') continue;

    switch (type) {
      case 'user_input': {
        break;
      }
      case 'model_output': {
        const blocks =
          (step as { content?: Array<{ type?: string; [k: string]: unknown }> })
            .content ?? [];
        for (const block of blocks) {
          if (block == null || typeof block !== 'object') continue;
          const blockType = block.type;
          if (blockType === 'text') {
            const text = (block as { text?: string }).text ?? '';
            const annotations = (
              block as {
                annotations?: Array<GoogleInteractionsAnnotation>;
              }
            ).annotations;
            content.push({
              type: 'text',
              text,
              ...googleProviderMetadata({ interactionId }),
            });
            const sources = annotationsToSources({ annotations, generateId });
            for (const source of sources) {
              content.push(source);
            }
          } else if (blockType === 'image') {
            const image = block as {
              data?: string;
              mime_type?: string;
              uri?: string;
            };
            if (image.data != null && image.data.length > 0) {
              content.push({
                type: 'file',
                mediaType: image.mime_type ?? 'image/png',
                data: { type: 'data', data: image.data },
                ...googleProviderMetadata({ interactionId }),
              });
            } else if (image.uri != null && image.uri.length > 0) {
              content.push({
                type: 'file',
                mediaType: image.mime_type ?? 'image/png',
                data: { type: 'url', url: new URL(image.uri) },
                ...googleProviderMetadata({ interactionId }),
              });
            }
          }
        }
        break;
      }
      case 'thought': {
        const thought = step as {
          signature?: string;
          summary?: Array<{ type: string; text?: string }>;
        };
        const summary = Array.isArray(thought.summary) ? thought.summary : [];
        const text = summary
          .filter(
            item => item?.type === 'text' && typeof item.text === 'string',
          )
          .map(item => item.text as string)
          .join('\n');
        content.push({
          type: 'reasoning',
          text,
          ...googleProviderMetadata({
            signature: thought.signature,
            interactionId,
          }),
        });
        break;
      }
      case 'function_call': {
        hasFunctionCall = true;
        const call = step as {
          id: string;
          name: string;
          arguments?: Record<string, unknown> | null;
          signature?: string | null;
        };
        content.push({
          type: 'tool-call',
          toolCallId: call.id,
          toolName: call.name,
          input: JSON.stringify(call.arguments ?? {}),
          ...googleProviderMetadata({
            signature: call.signature,
            interactionId,
          }),
        });
        break;
      }
      default: {
        if (BUILTIN_TOOL_CALL_TYPES.has(type)) {
          const call = step as {
            id?: string;
            arguments?: Record<string, unknown>;
            name?: string;
            server_name?: string;
          };
          const toolName =
            type === 'mcp_server_tool_call'
              ? (call.name ?? 'mcp_server_tool')
              : builtinToolNameFromCallType(type);
          const input = JSON.stringify(call.arguments ?? {});
          content.push({
            type: 'tool-call',
            toolCallId: call.id ?? generateId(),
            toolName,
            input,
            providerExecuted: true,
          });
        } else if (BUILTIN_TOOL_RESULT_TYPES.has(type)) {
          const result = step as {
            call_id?: string;
            result?: unknown;
            is_error?: boolean;
            name?: string;
          };
          const toolName =
            type === 'mcp_server_tool_result'
              ? (result.name ?? 'mcp_server_tool')
              : builtinToolNameFromResultType(type);
          content.push({
            type: 'tool-result',
            toolCallId: result.call_id ?? generateId(),
            toolName,
            result: (result.result ?? null) as NonNullable<JSONValue>,
          });
          const sources = builtinToolResultToSources({
            block:
              step as unknown as GoogleInteractionsBuiltinToolResultContent,
            generateId,
          });
          for (const source of sources) {
            content.push(source);
          }
        }
        break;
      }
    }
  }

  return { content, hasFunctionCall };
}
