import {
  openai,
  type OpenaiResponsesProviderMetadata,
  type OpenAILanguageModelResponsesOptions,
} from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  type InferUITools,
  type UIMessage,
} from 'ai';
import { rollDieToolWithProgrammaticCalling } from '@/tool/roll-die-tool-with-programmatic-calling';

const tools = {
  rollDieToolWithProgrammaticCalling,
};

type Tools = InferUITools<typeof tools>;
type Data = {
  providerMetadata: OpenaiResponsesProviderMetadata;
};

export type PreviousResponseIdUIMessage = UIMessage<unknown, Data, Tools>;

export type PreviousResponseIdRequestBody = {
  message: PreviousResponseIdUIMessage;
  previousProviderMetadata: OpenaiResponsesProviderMetadata | undefined;
};

export async function POST(req: Request) {
  const reqJson = await req.json();

  const { message, previousProviderMetadata } =
    reqJson as PreviousResponseIdRequestBody;

  // 提取先前的 OpenAI responseId，以便 Responses API 重放历史。
  const previousResponseId: string | null | undefined =
    !!previousProviderMetadata
      ? previousProviderMetadata.openai.responseId
      : undefined;

  const stream = createUIMessageStream<PreviousResponseIdUIMessage>({
    execute: async ({ writer }) => {
      const result = streamText({
        model: openai('gpt-5-mini'),
        // 仅发送最新用户消息；OpenAI 将通过 previousResponseId 获取先前轮次。
        messages: await convertToModelMessages([message]),
        tools,
        stopWhen: isStepCount(20),
        reasoning: 'low',
        providerOptions: {
          openai: {
            reasoningSummary: 'auto',
            store: true,
            // 通过传入上次调用的 responseId 启用历史查找。
            previousResponseId,
          } satisfies OpenAILanguageModelResponsesOptions,
        },
        onFinish: ({ providerMetadata }) => {
          if (!!providerMetadata) {
            // 返回 provider metadata，以便客户端持久化最新的 responseId。
            writer.write({
              type: 'data-providerMetadata',
              data: providerMetadata as OpenaiResponsesProviderMetadata,
              transient: true,
            });
          }
        },
      });
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
