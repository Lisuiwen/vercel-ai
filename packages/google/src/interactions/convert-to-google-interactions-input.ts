import type {
  LanguageModelV4FilePart,
  LanguageModelV4Prompt,
  LanguageModelV4ToolResultOutput,
  SharedV4Warning,
} from '@ai-sdk/provider';
import {
  convertToBase64,
  getTopLevelMediaType,
  isFullMediaType,
  resolveFullMediaType,
  resolveProviderReference,
} from '@ai-sdk/provider-utils';
import type {
  GoogleInteractionsContent,
  GoogleInteractionsContentBlock,
  GoogleInteractionsFunctionResultContent,
  GoogleInteractionsImageContent,
  GoogleInteractionsInput,
  GoogleInteractionsStep,
  GoogleInteractionsTextContent,
} from './google-interactions-prompt';

export type GoogleInteractionsMediaResolution =
  | 'low'
  | 'medium'
  | 'high'
  | 'ultra_high';

export type ConvertToGoogleInteractionsInputResult = {
  input: GoogleInteractionsInput;
  systemInstruction: string | undefined;
  warnings: Array<SharedV4Warning>;
};

/**
 * 将 AI SDK `LanguageModelV4Prompt` 转换为 Gemini 交互
 * 请求形状 (`{ input: Array<Step>, system_instruction }`)。
 *
 * 先前的助理内容往返为离散步骤：
 *   - 文本/图像内容→带有单个“content”数组的“model_output”步骤
 *   - 推理→“思考”步骤（“签名”+“摘要”）
 *   - 工具调用 → `function_call` 步骤
 * 用户回合（以及上一轮的工具结果回合）发送为
 * `user_input` 步骤的 `content[]` 保存用户的部分（文本、文件、
 * 以及 - 对于工具结果轮换 - `function_result` 块）。
 *
 * 处理文本部分、文件部分（图像/音频/文档/视频，所有四个部分）
 * `data.type` 形状），工具调用/工具结果往返，每步
 * `signature` 往返和状态压缩（放置助手/工具
 * 轮到其 `providerOptions.google.interactionId === previousInteractionId`)。
 */
export function convertToGoogleInteractionsInput({
  prompt,
  previousInteractionId,
  store,
  mediaResolution,
}: {
  prompt: LanguageModelV4Prompt;
  previousInteractionId?: string;
  store?: boolean;
  mediaResolution?: GoogleInteractionsMediaResolution;
}): ConvertToGoogleInteractionsInputResult {
  const warnings: Array<SharedV4Warning> = [];

  /*
   * 压实行为矩阵：
   *
   * - `previousInteractionId` set + `store !== false` → 紧凑的历史记录 (drop
   *   助理/工具将其“providerMetadata.google.interactionId”
   *   匹配），发出“previous_interaction_id”。
   * - `previousInteractionId` set + `store === false` → 发出警告
   *   （不连贯的组合），仍然发送完整的历史记录（无压缩）。
   * - `store === false`，没有 `previousInteractionId` → 不压缩。
   * - 默认 → 不压缩。
   */
  const incoherentCombo = previousInteractionId != null && store === false;
  const shouldCompact = previousInteractionId != null && store !== false;
  if (incoherentCombo) {
    warnings.push({
      type: 'other',
      message:
        'google.interactions: providerOptions.google.previousInteractionId was set together with store: false. These are incoherent (the prior interaction cannot be referenced when nothing was stored on the server); the full history will be sent and previous_interaction_id will still be emitted.',
    });
  }

  const compactedPrompt = shouldCompact
    ? compactPromptForPreviousInteraction({
        prompt,
        previousInteractionId,
      })
    : prompt;

  const systemTexts: Array<string> = [];
  const steps: Array<GoogleInteractionsStep> = [];

  for (const message of compactedPrompt) {
    switch (message.role) {
      case 'system': {
        systemTexts.push(message.content);
        break;
      }
      case 'user': {
        const content: Array<GoogleInteractionsContentBlock> = [];
        for (const part of message.content) {
          if (part.type === 'text') {
            content.push({ type: 'text', text: part.text });
          } else if (part.type === 'file') {
            const fileBlock = convertFilePartToContent({
              part,
              warnings,
              mediaResolution,
            });
            if (fileBlock != null) {
              content.push(fileBlock);
            }
          }
        }
        const merged = mergeAdjacentTextContent(content);
        if (merged.length > 0) {
          steps.push({ type: 'user_input', content: merged });
        }
        break;
      }
      case 'assistant': {
        /*
         * 先前的助理内容分散到每个逻辑块的一个步骤中。
         * 相邻的文本/图像内容块合并为一个
         * `model_output` 步骤（匹配 API 在输出中发出它们的方式）；
         * 推理和工具调用各自成为自己的步骤。
         */
        let pendingModelOutput: Array<GoogleInteractionsContentBlock> = [];
        const flushModelOutput = () => {
          if (pendingModelOutput.length > 0) {
            steps.push({ type: 'model_output', content: pendingModelOutput });
            pendingModelOutput = [];
          }
        };

        for (const part of message.content) {
          if (part.type === 'text') {
            pendingModelOutput.push({ type: 'text', text: part.text });
          } else if (part.type === 'reasoning') {
            flushModelOutput();
            const signature = part.providerOptions?.google?.signature as
              | string
              | undefined;
            steps.push({
              type: 'thought',
              ...(signature != null ? { signature } : {}),
              summary:
                part.text.length > 0
                  ? [{ type: 'text', text: part.text }]
                  : undefined,
            });
          } else if (part.type === 'file') {
            const fileBlock = convertFilePartToContent({
              part,
              warnings,
              mediaResolution,
            });
            if (fileBlock != null) {
              pendingModelOutput.push(fileBlock);
            }
          } else if (part.type === 'tool-call') {
            flushModelOutput();
            const signature = part.providerOptions?.google?.signature as
              | string
              | undefined;
            const args =
              typeof part.input === 'string'
                ? safeParseToolArgs(part.input)
                : ((part.input ?? {}) as Record<string, unknown>);
            steps.push({
              type: 'function_call',
              id: part.toolCallId,
              name: part.toolName,
              arguments: args,
              ...(signature != null ? { signature } : {}),
            });
          } else {
            warnings.push({
              type: 'other',
              message: `google.interactions: unsupported assistant content part type "${part.type}"; part dropped.`,
            });
          }
        }
        flushModelOutput();
        break;
      }
      case 'tool': {
        /*
         * 工具结果消息作为“user_input”步骤发出，其
         * content 为每个工具结果部分保存一个“function_result”块。
         * `function_result` 仍然是一个内容块类型（它位于
         * 步骤），而不是顶级步骤类型。
         */
        const content: Array<GoogleInteractionsContentBlock> = [];
        for (const part of message.content) {
          if (part.type !== 'tool-result') {
            warnings.push({
              type: 'other',
              message: `google.interactions: unsupported tool message part type "${part.type}"; part dropped.`,
            });
            continue;
          }
          const block = convertToolResultPart({
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            output: part.output,
            signature: part.providerOptions?.google?.signature as
              | string
              | undefined,
            warnings,
          });
          content.push(block);
        }
        if (content.length > 0) {
          steps.push({ type: 'user_input', content });
        }
        break;
      }
    }
  }

  const systemInstruction =
    systemTexts.length > 0 ? systemTexts.join('\n\n') : undefined;

  return { input: steps, systemInstruction, warnings };
}

/**
 * 将单个 AI SDK“LanguageModelV4FilePart”映射到 Gemini 交互
 * 内容块（“图像”/“音频”/“文档”/“视频”）。
 */
function convertFilePartToContent({
  part,
  warnings,
  mediaResolution,
}: {
  part: LanguageModelV4FilePart;
  warnings: Array<SharedV4Warning>;
  mediaResolution?: GoogleInteractionsMediaResolution;
}): GoogleInteractionsContent | undefined {
  if (part.data.type === 'text') {
    return {
      type: 'text',
      text: part.data.text,
    };
  }

  const topLevel = getTopLevelMediaType(part.mediaType);
  let kind: 'image' | 'audio' | 'video' | 'document' | undefined;
  switch (topLevel) {
    case 'image':
      kind = 'image';
      break;
    case 'audio':
      kind = 'audio';
      break;
    case 'video':
      kind = 'video';
      break;
    case 'application':
      kind = 'document';
      break;
    default:
      kind = undefined;
  }

  if (kind == null) {
    warnings.push({
      type: 'other',
      message: `google.interactions: unsupported file media type "${part.mediaType}"; part dropped.`,
    });
    return undefined;
  }

  const resolutionField =
    mediaResolution != null && (kind === 'image' || kind === 'video')
      ? { resolution: mediaResolution }
      : {};

  switch (part.data.type) {
    case 'data': {
      const mimeType = resolveFullMediaType({ part });
      return {
        type: kind,
        data: convertToBase64(part.data.data),
        mime_type: mimeType,
        ...resolutionField,
      };
    }
    case 'url': {
      return {
        type: kind,
        uri: part.data.url.toString(),
        ...(isFullMediaType(part.mediaType)
          ? { mime_type: part.mediaType }
          : {}),
        ...resolutionField,
      };
    }
    case 'reference': {
      const uri = resolveProviderReference({
        reference: part.data.reference,
        provider: 'google',
      });
      return {
        type: kind,
        uri,
        ...(isFullMediaType(part.mediaType)
          ? { mime_type: part.mediaType }
          : {}),
        ...resolutionField,
      };
    }
  }
}

/*
 * 删除属于链接交互一部分的辅助消息
 * (`前一个交互Id`)。工具结果轮流其工具调用对应项
 * 被丢弃的消息也会被修剪以保持消息流的格式良好。
 */
function compactPromptForPreviousInteraction({
  prompt,
  previousInteractionId,
}: {
  prompt: LanguageModelV4Prompt;
  previousInteractionId: string;
}): LanguageModelV4Prompt {
  const out: LanguageModelV4Prompt = [];
  const droppedToolCallIds = new Set<string>();

  for (const message of prompt) {
    if (message.role === 'assistant') {
      const matchesLinkedInteraction = message.content.some(part => {
        const partInteractionId = (
          part as { providerOptions?: { google?: { interactionId?: string } } }
        ).providerOptions?.google?.interactionId;
        return partInteractionId === previousInteractionId;
      });
      if (matchesLinkedInteraction) {
        for (const part of message.content) {
          if (part.type === 'tool-call') {
            droppedToolCallIds.add(part.toolCallId);
          }
        }
        continue;
      }
      out.push(message);
      continue;
    }
    if (message.role === 'tool') {
      const remaining = message.content.filter(part => {
        if (part.type !== 'tool-result') {
          return true;
        }
        return !droppedToolCallIds.has(part.toolCallId);
      });
      if (remaining.length === 0) {
        continue;
      }
      out.push({
        ...message,
        content: remaining as typeof message.content,
      });
      continue;
    }
    out.push(message);
  }

  return out;
}

function safeParseToolArgs(input: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(input);
    if (
      parsed != null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return { value: input };
  }
}

function convertToolResultPart({
  toolCallId,
  toolName,
  output,
  signature,
  warnings,
}: {
  toolCallId: string;
  toolName: string;
  output: LanguageModelV4ToolResultOutput;
  signature: string | undefined;
  warnings: Array<SharedV4Warning>;
}): GoogleInteractionsFunctionResultContent {
  const base = {
    type: 'function_result' as const,
    call_id: toolCallId,
    name: toolName,
    ...(signature != null ? { signature } : {}),
  };

  switch (output.type) {
    case 'text':
      return { ...base, result: output.value };
    case 'json':
      return { ...base, result: JSON.stringify(output.value) };
    case 'error-text':
      return { ...base, is_error: true, result: output.value };
    case 'error-json':
      return { ...base, is_error: true, result: JSON.stringify(output.value) };
    case 'execution-denied':
      return {
        ...base,
        is_error: true,
        result: output.reason ?? 'Tool execution denied by user.',
      };
    case 'content': {
      const blocks: Array<
        GoogleInteractionsTextContent | GoogleInteractionsImageContent
      > = [];
      for (const item of output.value) {
        if (item.type === 'text') {
          blocks.push({ type: 'text', text: item.text });
        } else if (item.type === 'file') {
          const topLevel = getTopLevelMediaType(item.mediaType);
          if (topLevel !== 'image') {
            warnings.push({
              type: 'other',
              message: `google.interactions: tool-result file with mediaType "${item.mediaType}" is not supported (Interactions \`function_result.result\` accepts only text and image content); part dropped.`,
            });
            continue;
          }
          const imageBlock = filePartToImageBlock({ part: item, warnings });
          if (imageBlock != null) {
            blocks.push(imageBlock);
          }
        } else {
          warnings.push({
            type: 'other',
            message: `google.interactions: tool-result content part type "${(item as { type: string }).type}" is not supported; part dropped.`,
          });
        }
      }
      return { ...base, result: blocks };
    }
  }
}

function filePartToImageBlock({
  part,
  warnings,
}: {
  part: {
    type: 'file';
    mediaType: string;
    data:
      | { type: 'data'; data: Uint8Array | string }
      | { type: 'url'; url: URL }
      | { type: 'reference'; reference: Record<string, string> }
      | { type: 'text'; text: string };
    filename?: string;
  };
  warnings: Array<SharedV4Warning>;
}): GoogleInteractionsImageContent | undefined {
  switch (part.data.type) {
    case 'data': {
      const mimeType = isFullMediaType(part.mediaType)
        ? part.mediaType
        : resolveFullMediaType({
            part: {
              type: 'file',
              mediaType: part.mediaType,
              data: part.data,
            } as LanguageModelV4FilePart,
          });
      return {
        type: 'image',
        data: convertToBase64(part.data.data),
        mime_type: mimeType,
      };
    }
    case 'url':
      return {
        type: 'image',
        uri: part.data.url.toString(),
        ...(isFullMediaType(part.mediaType)
          ? { mime_type: part.mediaType }
          : {}),
      };
    case 'reference': {
      const uri = resolveProviderReference({
        reference: part.data.reference,
        provider: 'google',
      });
      return {
        type: 'image',
        uri,
        ...(isFullMediaType(part.mediaType)
          ? { mime_type: part.mediaType }
          : {}),
      };
    }
    case 'text': {
      warnings.push({
        type: 'other',
        message:
          'google.interactions: tool-result image part with `data.type === "text"` is not representable as an image; part dropped.',
      });
      return undefined;
    }
  }
}

/*
 * 折叠单个用户步骤中相邻文本内容块的运行
 * 到一个组合文本块中，并用空行分隔。文本块
 * 带有“注释”的内容保持不变（注释与特定的
 * 文本跨度）。
 */
function mergeAdjacentTextContent(
  content: Array<GoogleInteractionsContentBlock>,
): Array<GoogleInteractionsContentBlock> {
  if (content.length < 2) {
    return content;
  }
  const result: Array<GoogleInteractionsContentBlock> = [];
  for (const block of content) {
    const last = result[result.length - 1];
    if (
      block.type === 'text' &&
      last != null &&
      last.type === 'text' &&
      (last as GoogleInteractionsTextContent).annotations == null &&
      (block as GoogleInteractionsTextContent).annotations == null
    ) {
      const merged: GoogleInteractionsTextContent = {
        type: 'text',
        text: `${(last as GoogleInteractionsTextContent).text}\n\n${(block as GoogleInteractionsTextContent).text}`,
      };
      result[result.length - 1] = merged;
      continue;
    }
    result.push(block);
  }
  return result;
}
