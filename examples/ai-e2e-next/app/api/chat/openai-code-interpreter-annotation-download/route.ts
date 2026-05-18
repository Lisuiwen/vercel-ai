import {
  openai,
  type OpenAILanguageModelResponsesOptions,
  type OpenaiResponsesSourceDocumentProviderMetadata,
} from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  type UIMessage,
} from 'ai';
const tools = {
  code_interpreter: openai.tools.codeInterpreter(),
} satisfies ToolSet;

export type OpenAICodeInterpreterMessage = UIMessage<
  {
    downloadLinks?: Array<{
      filename: string;
      url: string;
    }>;
  },
  UIDataTypes,
  InferUITools<typeof tools>
>;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const uiMessages = await validateUIMessages<OpenAICodeInterpreterMessage>({
    messages,
  });

  // 在生成时收集带容器文件引用的 sources
  const containerFileSources: Array<{
    containerId: string;
    fileId: string;
    filename: string;
  }> = [];

  const result = streamText({
    model: openai('gpt-5-nano'),
    tools,
    messages: await convertToModelMessages(uiMessages),
    onStepFinish: async ({ sources, request }) => {
      console.log(JSON.stringify(request.body, null, 2));

      // 从 sources 收集容器文件引用
      for (const source of sources) {
        if (source.sourceType === 'document') {
          const providerMetadata = source.providerMetadata as
            | OpenaiResponsesSourceDocumentProviderMetadata
            | undefined;
          if (!providerMetadata) continue;
          const { openai } = providerMetadata;
          if (openai.type === 'container_file_citation') {
            const { containerId, fileId } = openai;
            const filename = source.filename || source.title;
            // 避免重复
            const exists = containerFileSources.some(
              s => s.containerId === containerId && s.fileId === fileId,
            );
            if (!exists) {
              containerFileSources.push({ containerId, fileId, filename });
            }
          }
        }
      }
    },
    providerOptions: {
      openai: {
        store: true,
      } satisfies OpenAILanguageModelResponsesOptions,
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    messageMetadata: ({ part }) => {
      // 流结束后，从收集的 sources 创建下载链接
      if (part.type === 'finish' && containerFileSources.length > 0) {
        const downloadLinks = containerFileSources.map(source => ({
          filename: source.filename,
          url: `/api/download-container-file/openai?container_id=${encodeURIComponent(source.containerId)}&file_id=${encodeURIComponent(source.fileId)}&filename=${encodeURIComponent(source.filename)}`,
        }));

        return {
          downloadLinks,
        };
      }
    },
  });
}
