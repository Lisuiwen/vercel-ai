import {
  UnsupportedFunctionalityError,
  type LanguageModelV4Prompt,
  type LanguageModelV4ToolResultOutput,
} from '@ai-sdk/provider';
import {
  convertToBase64,
  getTopLevelMediaType,
  isFullMediaType,
  resolveFullMediaType,
  resolveProviderReference,
} from '@ai-sdk/provider-utils';
import type {
  GoogleContent,
  GoogleContentPart,
  GoogleFunctionResponsePart,
  GooglePrompt,
} from './google-prompt';

const dataUrlRegex = /^data:([^;,]+);base64,(.+)$/s;

function parseBase64DataUrl(
  value: string,
): { mediaType: string; data: string } | undefined {
  const match = dataUrlRegex.exec(value);
  if (match == null) {
    return undefined;
  }

  return {
    mediaType: match[1],
    data: match[2],
  };
}

function convertUrlToolResultPart(
  url: string,
): GoogleFunctionResponsePart | undefined {
  // 根据 https://ai.google.dev/api/caching#FunctionResponsePart，仅支持内联数据。
  // https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/function-calling#functionresponsepart 建议这
  // Vertex 可能有所不同，但这需要针对这两个 API 进行确认和进一步测试。
  const parsedDataUrl = parseBase64DataUrl(url);
  if (parsedDataUrl == null) {
    return undefined;
  }

  return {
    inlineData: {
      mimeType: parsedDataUrl.mediaType,
      data: parsedDataUrl.data,
    },
  };
}

/*
 * 使用 Response 函数将工具结果内容部分附加到消息中
 * 支持多模式部分的格式（例如内联图像/文件并排
 * 文本）。 Gemini 3+ 模型支持此格式。
 */
function appendToolResultParts(
  parts: GoogleContentPart[],
  toolName: string,
  outputValue: Extract<
    LanguageModelV4ToolResultOutput,
    { type: 'content' }
  >['value'],
  toolCallId?: string,
): void {
  const functionResponseParts: GoogleFunctionResponsePart[] = [];
  const responseTextParts: string[] = [];

  for (const contentPart of outputValue) {
    switch (contentPart.type) {
      case 'text': {
        responseTextParts.push(contentPart.text);
        break;
      }
      case 'file': {
        if (contentPart.data.type === 'data') {
          functionResponseParts.push({
            inlineData: {
              mimeType: resolveFullMediaType({ part: contentPart }),
              data: convertToBase64(contentPart.data.data),
            },
          });
        } else if (contentPart.data.type === 'url') {
          const functionResponsePart = convertUrlToolResultPart(
            contentPart.data.url.toString(),
          );

          if (functionResponsePart != null) {
            functionResponseParts.push(functionResponsePart);
          } else {
            responseTextParts.push(JSON.stringify(contentPart));
          }
        } else {
          responseTextParts.push(JSON.stringify(contentPart));
        }
        break;
      }
      default: {
        responseTextParts.push(JSON.stringify(contentPart));
        break;
      }
    }
  }

  parts.push({
    functionResponse: {
      ...(toolCallId != null ? { id: toolCallId } : {}),
      name: toolName,
      response: {
        name: toolName,
        content:
          responseTextParts.length > 0
            ? responseTextParts.join('\n')
            : 'Tool executed successfully.',
      },
      ...(functionResponseParts.length > 0
        ? { parts: functionResponseParts }
        : {}),
    },
  });
}

/*
 * 使用 Gemini 3 之前版本的旧格式附加工具结果内容部分
 * 不支持 functionResponse 中的多模态部分的模型。相反，
 * 像图像这样的非文本内容作为单独的顶级 inlineData 部分发送。
 */
function appendLegacyToolResultParts(
  parts: GoogleContentPart[],
  toolName: string,
  outputValue: Extract<
    LanguageModelV4ToolResultOutput,
    { type: 'content' }
  >['value'],
  toolCallId?: string,
): void {
  for (const contentPart of outputValue) {
    switch (contentPart.type) {
      case 'text':
        parts.push({
          functionResponse: {
            ...(toolCallId != null ? { id: toolCallId } : {}),
            name: toolName,
            response: {
              name: toolName,
              content: contentPart.text,
            },
          },
        });
        break;
      case 'file': {
        if (
          contentPart.data.type === 'data' &&
          getTopLevelMediaType(contentPart.mediaType) === 'image'
        ) {
          parts.push(
            {
              inlineData: {
                mimeType: resolveFullMediaType({ part: contentPart }),
                data: convertToBase64(contentPart.data.data),
              },
            },
            {
              text: 'Tool executed successfully and returned this image as a response',
            },
          );
        } else {
          parts.push({ text: JSON.stringify(contentPart) });
        }
        break;
      }
      default:
        parts.push({ text: JSON.stringify(contentPart) });
        break;
    }
  }
}

export function convertToGoogleMessages(
  prompt: LanguageModelV4Prompt,
  options?: {
    isGemmaModel?: boolean;
    /**
     * 读取每个部件元数据时要在“providerOptions”下查找的名称
     * （例如思想签名）。按顺序尝试；第一场比赛获胜。对于
     * 顶点提供程序，这是“['googleVertex', 'vertex']”（首先是新密钥，
     * 旧密钥作为后备），对于 Google 提供商来说，它是“['google']”。
     */
    providerOptionsNames?: readonly string[];
    supportsFunctionResponseParts?: boolean;
  },
): GooglePrompt {
  const systemInstructionParts: Array<{ text: string }> = [];
  const contents: Array<GoogleContent> = [];
  let systemMessagesAllowed = true;
  const isGemmaModel = options?.isGemmaModel ?? false;
  const providerOptionsNames = options?.providerOptionsNames ?? ['google'];
  const isVertexLike = !providerOptionsNames.includes('google');
  const supportsFunctionResponseParts =
    options?.supportsFunctionResponseParts ?? true;

  const readProviderOpts = (part: {
    providerOptions?: Record<string, unknown> | undefined;
  }): Record<string, unknown> | undefined => {
    for (const name of providerOptionsNames) {
      const v = part.providerOptions?.[name];
      if (v != null) return v as Record<string, unknown>;
    }
    // 跨命名空间回退（网关互操作）：顶点提供者可能会收到
    // “google”下的元数据，Google 提供商可能会收到元数据
    // 在`googleVertex`/`vertex`下。
    if (isVertexLike) {
      return part.providerOptions?.google as
        | Record<string, unknown>
        | undefined;
    }
    return (part.providerOptions?.googleVertex ??
      part.providerOptions?.vertex) as Record<string, unknown> | undefined;
  };

  for (const { role, content } of prompt) {
    switch (role) {
      case 'system': {
        if (!systemMessagesAllowed) {
          throw new UnsupportedFunctionalityError({
            functionality:
              'system messages are only supported at the beginning of the conversation',
          });
        }

        systemInstructionParts.push({ text: content });
        break;
      }

      case 'user': {
        systemMessagesAllowed = false;

        const parts: GoogleContentPart[] = [];

        for (const part of content) {
          switch (part.type) {
            case 'text': {
              parts.push({ text: part.text });
              break;
            }

            case 'file': {
              switch (part.data.type) {
                case 'url': {
                  parts.push({
                    fileData: {
                      mimeType: resolveFullMediaType({ part }),
                      fileUri: part.data.url.toString(),
                    },
                  });
                  break;
                }
                case 'reference': {
                  if (isVertexLike) {
                    throw new UnsupportedFunctionalityError({
                      functionality: 'file parts with provider references',
                    });
                  }

                  parts.push({
                    fileData: {
                      mimeType: resolveFullMediaType({ part }),
                      fileUri: resolveProviderReference({
                        reference: part.data.reference,
                        provider: 'google',
                      }),
                    },
                  });
                  break;
                }
                case 'text': {
                  parts.push({
                    inlineData: {
                      mimeType: isFullMediaType(part.mediaType)
                        ? part.mediaType
                        : 'text/plain',
                      data: convertToBase64(
                        new TextEncoder().encode(part.data.text),
                      ),
                    },
                  });
                  break;
                }
                case 'data': {
                  parts.push({
                    inlineData: {
                      mimeType: resolveFullMediaType({ part }),
                      data: convertToBase64(part.data.data),
                    },
                  });
                  break;
                }
              }

              break;
            }
          }
        }

        contents.push({ role: 'user', parts });
        break;
      }

      case 'assistant': {
        systemMessagesAllowed = false;

        contents.push({
          role: 'model',
          parts: content
            .map(part => {
              const providerOpts = readProviderOpts(part);
              const thoughtSignature =
                providerOpts?.thoughtSignature != null
                  ? String(providerOpts.thoughtSignature)
                  : undefined;

              switch (part.type) {
                case 'text': {
                  return part.text.length === 0
                    ? undefined
                    : {
                        text: part.text,
                        thoughtSignature,
                      };
                }

                case 'reasoning': {
                  return part.text.length === 0
                    ? undefined
                    : {
                        text: part.text,
                        thought: true,
                        thoughtSignature,
                      };
                }

                case 'reasoning-file': {
                  switch (part.data.type) {
                    case 'url': {
                      throw new UnsupportedFunctionalityError({
                        functionality:
                          'File data URLs in assistant messages are not supported',
                      });
                    }
                    case 'data': {
                      return {
                        inlineData: {
                          mimeType: part.mediaType,
                          data: convertToBase64(part.data.data),
                        },
                        thought: true,
                        thoughtSignature,
                      };
                    }
                  }
                  break;
                }

                case 'file': {
                  switch (part.data.type) {
                    case 'url': {
                      throw new UnsupportedFunctionalityError({
                        functionality:
                          'File data URLs in assistant messages are not supported',
                      });
                    }
                    case 'reference': {
                      if (isVertexLike) {
                        throw new UnsupportedFunctionalityError({
                          functionality: 'file parts with provider references',
                        });
                      }

                      return {
                        fileData: {
                          mimeType: part.mediaType,
                          fileUri: resolveProviderReference({
                            reference: part.data.reference,
                            provider: 'google',
                          }),
                        },
                        ...(providerOpts?.thought === true
                          ? { thought: true }
                          : {}),
                        thoughtSignature,
                      };
                    }
                    case 'text': {
                      return {
                        inlineData: {
                          mimeType: isFullMediaType(part.mediaType)
                            ? part.mediaType
                            : 'text/plain',
                          data: convertToBase64(
                            new TextEncoder().encode(part.data.text),
                          ),
                        },
                        ...(providerOpts?.thought === true
                          ? { thought: true }
                          : {}),
                        thoughtSignature,
                      };
                    }
                    case 'data': {
                      return {
                        inlineData: {
                          mimeType: part.mediaType,
                          data: convertToBase64(part.data.data),
                        },
                        ...(providerOpts?.thought === true
                          ? { thought: true }
                          : {}),
                        thoughtSignature,
                      };
                    }
                  }
                  break;
                }

                case 'tool-call': {
                  const serverToolCallId =
                    providerOpts?.serverToolCallId != null
                      ? String(providerOpts.serverToolCallId)
                      : undefined;
                  const serverToolType =
                    providerOpts?.serverToolType != null
                      ? String(providerOpts.serverToolType)
                      : undefined;

                  if (serverToolCallId && serverToolType) {
                    return {
                      toolCall: {
                        toolType: serverToolType,
                        args:
                          typeof part.input === 'string'
                            ? JSON.parse(part.input)
                            : part.input,
                        id: serverToolCallId,
                      },
                      thoughtSignature,
                    };
                  }

                  return {
                    functionCall: {
                      ...(part.toolCallId != null
                        ? { id: part.toolCallId }
                        : {}),
                      name: part.toolName,
                      args: part.input,
                    },
                    thoughtSignature,
                  };
                }

                case 'tool-result': {
                  const serverToolCallId =
                    providerOpts?.serverToolCallId != null
                      ? String(providerOpts.serverToolCallId)
                      : undefined;
                  const serverToolType =
                    providerOpts?.serverToolType != null
                      ? String(providerOpts.serverToolType)
                      : undefined;

                  if (serverToolCallId && serverToolType) {
                    return {
                      toolResponse: {
                        toolType: serverToolType,
                        response:
                          part.output.type === 'json' ? part.output.value : {},
                        id: serverToolCallId,
                      },
                      thoughtSignature,
                    };
                  }

                  return undefined;
                }
              }
            })
            .filter(part => part !== undefined),
        });

        break;
      }

      case 'tool': {
        systemMessagesAllowed = false;

        const parts: GoogleContentPart[] = [];

        for (const part of content) {
          if (part.type === 'tool-approval-response') {
            continue;
          }

          const partProviderOpts = readProviderOpts(part);
          const serverToolCallId =
            partProviderOpts?.serverToolCallId != null
              ? String(partProviderOpts.serverToolCallId)
              : undefined;
          const serverToolType =
            partProviderOpts?.serverToolType != null
              ? String(partProviderOpts.serverToolType)
              : undefined;

          if (serverToolCallId && serverToolType) {
            const serverThoughtSignature =
              partProviderOpts?.thoughtSignature != null
                ? String(partProviderOpts.thoughtSignature)
                : undefined;

            if (contents.length > 0) {
              const lastContent = contents[contents.length - 1];
              if (lastContent.role === 'model') {
                lastContent.parts.push({
                  toolResponse: {
                    toolType: serverToolType,
                    response:
                      part.output.type === 'json' ? part.output.value : {},
                    id: serverToolCallId,
                  },
                  thoughtSignature: serverThoughtSignature,
                });
                continue;
              }
            }
          }

          const output = part.output;

          if (output.type === 'content') {
            if (supportsFunctionResponseParts) {
              appendToolResultParts(
                parts,
                part.toolName,
                output.value,
                part.toolCallId,
              );
            } else {
              appendLegacyToolResultParts(
                parts,
                part.toolName,
                output.value,
                part.toolCallId,
              );
            }
          } else {
            parts.push({
              functionResponse: {
                ...(part.toolCallId != null ? { id: part.toolCallId } : {}),
                name: part.toolName,
                response: {
                  name: part.toolName,
                  content:
                    output.type === 'execution-denied'
                      ? (output.reason ?? 'Tool call execution denied.')
                      : output.value,
                },
              },
            });
          }
        }

        contents.push({
          role: 'user',
          parts,
        });
        break;
      }
    }
  }

  if (
    isGemmaModel &&
    systemInstructionParts.length > 0 &&
    contents.length > 0 &&
    contents[0].role === 'user'
  ) {
    const systemText = systemInstructionParts
      .map(part => part.text)
      .join('\n\n');

    contents[0].parts.unshift({ text: systemText + '\n\n' });
  }

  return {
    systemInstruction:
      systemInstructionParts.length > 0 && !isGemmaModel
        ? { parts: systemInstructionParts }
        : undefined,
    contents,
  };
}
