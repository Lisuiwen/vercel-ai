import type {
  JSONValue,
  LanguageModelV4FinishReason,
  LanguageModelV4StreamPart,
  LanguageModelV4Usage,
  SharedV4ProviderMetadata,
  SharedV4Warning,
} from '@ai-sdk/provider';
import {
  createIdGenerator,
  DelayedPromise,
  type InferSchema,
  type FlexibleSchema,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import type { ServerResponse } from 'http';
import { logWarnings } from '../logger/log-warnings';
import { resolveLanguageModel } from '../model/resolve-model';
import type { LanguageModelCallOptions } from '../prompt/language-model-call-options';
import { prepareLanguageModelCallOptions } from '../prompt/prepare-language-model-call-options';
import type { RequestOptions } from '../prompt/request-options';
import { convertToLanguageModelPrompt } from '../prompt/convert-to-language-model-prompt';
import type { Prompt } from '../prompt/prompt';
import { standardizePrompt } from '../prompt/standardize-prompt';
import { wrapGatewayError } from '../prompt/wrap-gateway-error';
import { createTelemetryDispatcher } from '../telemetry/create-telemetry-dispatcher';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import { createTextStreamResponse } from '../text-stream/create-text-stream-response';
import { pipeTextStreamToResponse } from '../text-stream/pipe-text-stream-to-response';
import type {
  CallWarning,
  FinishReason,
  LanguageModel,
} from '../types/language-model';
import type { LanguageModelRequestMetadata } from '../types/language-model-request-metadata';
import type { LanguageModelResponseMetadata } from '../types/language-model-response-metadata';
import type { ProviderMetadata } from '../types/provider-metadata';
import {
  asLanguageModelUsage,
  createNullLanguageModelUsage,
  type LanguageModelUsage,
} from '../types/usage';
import { isDeepEqualData, parsePartialJson, type DeepPartial } from '../util';
import {
  createAsyncIterableStream,
  type AsyncIterableStream,
} from '../util/async-iterable-stream';
import type { Callback } from '../util/callback';
import { createStitchableStream } from '../util/create-stitchable-stream';
import type { DownloadFunction } from '../util/download/download-function';
import { notify } from '../util/notify';
import { now as originalNow } from '../util/now';
import { prepareRetries } from '../util/prepare-retries';
import type {
  GenerateObjectEndEvent,
  GenerateObjectStartEvent,
  GenerateObjectStepEndEvent,
  GenerateObjectStepStartEvent,
} from './structured-output-events';
import { getOutputStrategy, type OutputStrategy } from './output-strategy';
import { parseAndValidateObjectResultWithRepair } from './parse-and-validate-object-result';
import type { RepairTextFunction } from './repair-text';
import type {
  ObjectStreamPart,
  StreamObjectResult,
} from './stream-object-result';
import { validateObjectGenerationInput } from './validate-object-generation-input';

const originalGenerateId = createIdGenerator({ prefix: 'aiobj', size: 24 });

/**
 * 使用`onError`选项设置的回调。
 *
 * @param event - 传递给回调的事件。
 */
export type StreamObjectOnErrorCallback = (event: {
  error: unknown;
}) => Promise<void> | void;

/**
 * 使用`onFinish`选项设置回调。
 *
 * @param event - 传递给回调的事件。
 */
export type StreamObjectOnFinishCallback<RESULT> = (event: {
  /**
   * 生成的响应的令牌使用情况。
   */
  usage: LanguageModelUsage;

  /**
   * 生成的对象。如果最终对象与架构不匹配，则可能是未定义的。
   */
  object: RESULT | undefined;

  /**
   * 任选的错误对象。例如当最终对象与架构不匹配时出现 TypeValidationError。
   */
  error: unknown | undefined;

  /**
   * 响应元数据。
   */
  response: LanguageModelResponseMetadata;

  /**
   * 来自模型提供商的警告（例如不支持的设置）。
   */
  warnings?: CallWarning[];

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从AI SDK发送给成功并实现特定的成功
   * 可以完全封装在提供者中的功能。
   */
  providerMetadata: ProviderMetadata | undefined;
}) => Promise<void> | void;

/**
 * 使用语言模型为给定的提示和模式生成结构化、类型化的对象。
 *
 * 该函数输出流。如果您不想流式传输输出，请改用`generateObject`。
 *
 * @param model - 要使用的语言模型。
 *
 * @param system - 将作为提示的一部分的系统消息。
 * @param prompt - 一个简单的文字提示。您可以使用`提示`或`消息`，但不能同时使用两者。
 * @param messages - 消息列表。您可以使用`提示`或`消息`，但不能同时使用两者。
 * @param allowSystemInMessages - `提示`或`消息`字段中是否允许系统消息。默认值：假。
 *
 * @param maxOutputTokens - 生成的最大令牌数。
 * @param temperature - 温度设定。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置`温度`或`topP`，但不能同时设置两者。
 * @param topP - 细胞核取样。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * 建议设置`温度`或`topP`，但不能同时设置两者。
 * @param topK - 对于每个后续标记，仅从前 K 个选项中进行采样。
 * 用于删除“长尾”低概率响应。
 * 仅推荐用于高级用例。通常您只需要使用温度。
 * @param presencePenalty - 存在惩罚设置。
 * 它会影响模型重复提示中已有信息的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param frequencyPenalty - 频率惩罚设置。
 * 它影响模型重复使用相同单词或短语的可能性。
 * 该值被传递给提供者。范围取决于提供商和型号。
 * @param stopSequences - 停止序列。
 * 如果设置，模型将在生成停止序列之一时停止生成文本。
 * @param seed - 用于随机采样的种子（整数）。
 * 如果模型设置并支持，调用将生成确定性结果。
 *
 * @param maxRetries - 最大重试次数。设置为 0 以禁用重试。默认值：2。
 * @param abortSignal - 可用于取消调用的可选中止信号。
 * @param headers - 与请求一起发送的附加 HTTP 标头。仅适用于基于 HTTP 的提供商。
 *
 * @param schema - 模型应生成的对象的架构。
 * @param schemaName - 应生成的输出的可选名称。
 * 一些提供者使用额外的法学硕士指导，例如
 * 通过工具或模式名称。
 * @param schemaDescription - 应生成的输出的可选描述。
 * 一些提供者使用额外的法学硕士指导，例如
 * 通过工具或模式描述。
 *
 * @param output - 输出的类型。
 *
 * - 'object'：输出是一个对象。
 * - 'array'：输出是一个阵列。
 * - 'enum'：输出是一个枚举。
 * -“无模式”：输出不是模式。
 *
 * @param telemetry - 可选遥测配置。
 *
 * @param providerOptions - 其他特定于提供商的选项。他们通过
 * 从AI SDK发送给成功并实现特定的成功
 * 可以完全封装在提供者中的功能。
 *
 * @返回
 * 用于访问部分对象流和附加信息的结果对象。
 *
 * @deprecated 请使用带标记的`output`设置的`streamText`。
 */
export function streamObject<
  SCHEMA extends FlexibleSchema<unknown> = FlexibleSchema<JSONValue>,
  OUTPUT extends 'object' | 'array' | 'enum' | 'no-schema' =
    InferSchema<SCHEMA> extends string ? 'enum' : 'object',
  RESULT = OUTPUT extends 'array'
    ? Array<InferSchema<SCHEMA>>
    : InferSchema<SCHEMA>,
>(
  options: Omit<LanguageModelCallOptions, 'stopSequences'> &
    Omit<RequestOptions, 'timeout'> &
    Prompt &
    (OUTPUT extends 'enum'
      ? {
          /**
           * 模型应使用的枚举值。
           */
          enum: Array<RESULT>;
          output: 'enum';
        }
      : OUTPUT extends 'no-schema'
        ? {}
        : {
            /**
             * 模型应生成的对象的架构。
             */
            schema: SCHEMA;

            /**
             * 应生成的输出的可选名称。
             * 一些提供者使用额外的法学硕士指导，例如
             * 通过工具或模式名称。
             */
            schemaName?: string;

            /**
             * 应生成的输出的可选描述。
             * 一些提供者使用额外的法学硕士指导，例如
             * 通过工具或模式描述。
             */
            schemaDescription?: string;
          }) & {
      output?: OUTPUT;

      /**
       * 要使用的语言模型。
       */
      model: LanguageModel;

      /**
       * 尝试修复模型原始输出的函数
       * 启用JSON解析。
       */
      experimental_repairText?: RepairTextFunction;

      /**
       * 可选遥测配置。
       */
      telemetry?: TelemetryOptions;

      /**
       * 可选遥测配置。
       *
       * @deprecated 请改用`遥测`。该别名将在未来的主要版本中删除。
       */
      experimental_telemetry?: TelemetryOptions;

      /**
       * 使用URL的自定义下载功能。
       *
       * 默认情况下，如果模型不支持给定媒体类型的URL，则下载文件。
       */
      experimental_download?: DownloadFunction | undefined;

      /**
       * 其他特定于提供商的选项。他们通过
       * 从AI SDK发送给成功并实现特定的成功
       * 可以完全封装在提供者中的功能。
       */
      providerOptions?: ProviderOptions;

      /**
       * 当streamObject操作开始时调用的回调，
       * 在拨打LLM电话之前。
       */
      experimental_onStart?: Callback<GenerateObjectStartEvent>;

      /**
       * 模型调用（步骤）开始时调用的回调，
       * 在调用提供者之前。
       */
      experimental_onStepStart?: Callback<GenerateObjectStepStartEvent>;

      /**
       * 模型流步骤完成时调用的回调，
       * 在最终模式验证之前使用原始累积文本。
       */
      onStepFinish?: Callback<GenerateObjectStepEndEvent>;

      /**
       * 流式传输过程中发生错误时调用的回调。
       * 您可以使用它来记录错误。
       * 流处理将暂停，直到回调承诺得到解决。
       */
      onError?: StreamObjectOnErrorCallback;

      /**
       * LLM响应和最终对象验证完成时调用的回调。
       */
      onFinish?: Callback<GenerateObjectEndEvent<RESULT>>;

      /**
       * 内部的。仅供测试使用。可能会更改，恕不另行通知。
       */
      _internal?: {
        generateId?: () => string;
        currentDate?: () => Date;
        now?: () => number;
      };
    },
): StreamObjectResult<
  OUTPUT extends 'enum'
    ? string
    : OUTPUT extends 'array'
      ? RESULT
      : DeepPartial<RESULT>,
  OUTPUT extends 'array' ? RESULT : RESULT,
  OUTPUT extends 'array'
    ? RESULT extends Array<infer U>
      ? AsyncIterableStream<U>
      : never
    : never
> {
  const {
    model,
    output = 'object',
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
    maxRetries,
    abortSignal,
    headers,
    experimental_repairText: repairText,
    experimental_telemetry,
    telemetry = experimental_telemetry,
    experimental_download: download,
    providerOptions,
    experimental_onStart: onStart,
    experimental_onStepStart: onStepStart,
    onStepFinish,
    onError = ({ error }: { error: unknown }) => {
      console.error(error);
    },
    onFinish,
    _internal: {
      generateId = originalGenerateId,
      currentDate = () => new Date(),
      now = originalNow,
    } = {},
    ...settings
  } = options;

  const enumValues =
    'enum' in options && options.enum ? options.enum : undefined;

  const {
    schema: inputSchema,
    schemaDescription,
    schemaName,
  } = 'schema' in options ? options : {};

  validateObjectGenerationInput({
    output,
    schema: inputSchema,
    schemaName,
    schemaDescription,
    enumValues,
  });

  const outputStrategy = getOutputStrategy({
    output,
    schema: inputSchema,
    enumValues,
  });

  return new DefaultStreamObjectResult({
    model,
    telemetry,
    headers,
    settings,
    maxRetries,
    abortSignal,
    outputStrategy,
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
    schemaName,
    schemaDescription,
    providerOptions,
    repairText,
    onStart,
    onStepStart,
    onStepFinish,
    onError,
    onFinish,
    download,
    generateId,
    currentDate,
    now,
  });
}

class DefaultStreamObjectResult<
  PARTIAL,
  RESULT,
  ELEMENT_STREAM,
> implements StreamObjectResult<PARTIAL, RESULT, ELEMENT_STREAM> {
  private readonly _object = new DelayedPromise<RESULT>();
  private readonly _usage = new DelayedPromise<LanguageModelUsage>();
  private readonly _providerMetadata = new DelayedPromise<
    ProviderMetadata | undefined
  >();
  private readonly _warnings = new DelayedPromise<CallWarning[] | undefined>();
  private readonly _request = new DelayedPromise<
    Omit<LanguageModelRequestMetadata, 'messages'>
  >();
  private readonly _response = new DelayedPromise<
    Omit<LanguageModelResponseMetadata, 'messages'>
  >();
  private readonly _finishReason = new DelayedPromise<FinishReason>();

  private readonly baseStream: ReadableStream<ObjectStreamPart<PARTIAL>>;

  private readonly outputStrategy: OutputStrategy<
    PARTIAL,
    RESULT,
    ELEMENT_STREAM
  >;

  constructor({
    model: modelArg,
    headers,
    telemetry,
    settings,
    maxRetries: maxRetriesArg,
    abortSignal,
    outputStrategy,
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
    schemaName,
    schemaDescription,
    providerOptions,
    repairText,
    onStart,
    onStepStart,
    onStepFinish,
    onError,
    onFinish,
    download,
    generateId,
    currentDate,
    now,
  }: {
    model: LanguageModel;
    telemetry: TelemetryOptions | undefined;
    headers: Record<string, string | undefined> | undefined;
    settings: LanguageModelCallOptions;
    maxRetries: number | undefined;
    abortSignal: AbortSignal | undefined;
    outputStrategy: OutputStrategy<PARTIAL, RESULT, ELEMENT_STREAM>;
    instructions: Prompt['instructions'];
    system: Prompt['system'];
    prompt: Prompt['prompt'];
    messages: Prompt['messages'];
    allowSystemInMessages: Prompt['allowSystemInMessages'];
    schemaName: string | undefined;
    schemaDescription: string | undefined;
    providerOptions: ProviderOptions | undefined;
    repairText: RepairTextFunction | undefined;
    onStart: Callback<GenerateObjectStartEvent> | undefined;
    onStepStart: Callback<GenerateObjectStepStartEvent> | undefined;
    onStepFinish: Callback<GenerateObjectStepEndEvent> | undefined;
    onError: StreamObjectOnErrorCallback;
    onFinish: Callback<GenerateObjectEndEvent<RESULT>> | undefined;
    download: DownloadFunction | undefined;
    generateId: () => string;
    currentDate: () => Date;
    now: () => number;
  }) {
    const model = resolveLanguageModel(modelArg);

    const { maxRetries, retry } = prepareRetries({
      maxRetries: maxRetriesArg,
      abortSignal,
    });

    const callSettings = prepareLanguageModelCallOptions(settings);

    const telemetryDispatcher = createTelemetryDispatcher({
      telemetry,
    });

    const self = this;

    const stitchableStream =
      createStitchableStream<ObjectStreamPart<PARTIAL>>();

    const eventProcessor = new TransformStream<
      ObjectStreamPart<PARTIAL>,
      ObjectStreamPart<PARTIAL>
    >({
      transform(chunk, controller) {
        controller.enqueue(chunk);

        if (chunk.type === 'error') {
          onError({ error: wrapGatewayError(chunk.error) });
        }
      },
    });

    this.baseStream = stitchableStream.stream.pipeThrough(eventProcessor);

    const callId = generateId();

    (async () => {
      const jsonSchema = await outputStrategy.jsonSchema();

      await notify({
        event: {
          callId,
          operationId: 'ai.streamObject' as const,
          provider: model.provider,
          modelId: model.modelId,
          system: instructions ?? system,
          prompt,
          messages,
          maxOutputTokens: callSettings.maxOutputTokens,
          temperature: callSettings.temperature,
          topP: callSettings.topP,
          topK: callSettings.topK,
          presencePenalty: callSettings.presencePenalty,
          frequencyPenalty: callSettings.frequencyPenalty,
          seed: callSettings.seed,
          maxRetries,
          headers,
          providerOptions,
          output: outputStrategy.type as
            | 'object'
            | 'array'
            | 'enum'
            | 'no-schema',
          schema: jsonSchema as Record<string, unknown> | undefined,
          schemaName,
          schemaDescription,
        },
        callbacks: [onStart, telemetryDispatcher.onStart],
      });

      const standardizedPrompt = await standardizePrompt({
        instructions,
        system,
        prompt,
        messages,
        allowSystemInMessages,
      } as Prompt);

      const callOptions = {
        responseFormat: {
          type: 'json' as const,
          schema: jsonSchema,
          name: schemaName,
          description: schemaDescription,
        },
        ...prepareLanguageModelCallOptions(settings),
        prompt: await convertToLanguageModelPrompt({
          prompt: standardizedPrompt,
          supportedUrls: await model.supportedUrls,
          download,
          provider: model.provider.split('.')[0],
        }),
        providerOptions,
        abortSignal,
        headers,
        includeRawChunks: false,
      };

      await notify({
        event: {
          callId,
          stepNumber: 0 as const,
          provider: model.provider,
          modelId: model.modelId,
          providerOptions,
          headers,
          promptMessages: callOptions.prompt,
        },
        callbacks: [onStepStart, telemetryDispatcher.onObjectStepStart],
      });

      const transformer: Transformer<
        LanguageModelV4StreamPart,
        ObjectStreamInputPart
      > = {
        transform: (chunk, controller) => {
          switch (chunk.type) {
            case 'text-delta':
              controller.enqueue(chunk.delta);
              break;
            case 'response-metadata':
            case 'finish':
            case 'error':
            case 'stream-start':
              controller.enqueue(chunk);
              break;
          }
        },
      };

      const startTimestampMs = now();
      const { stream, response, request } = await retry(() =>
        model.doStream(callOptions),
      );

      self._request.resolve(request ?? {});

      let warnings: SharedV4Warning[] | undefined;
      let usage: LanguageModelUsage = createNullLanguageModelUsage();
      let finishReason: FinishReason | undefined;
      let providerMetadata: ProviderMetadata | undefined;
      let object: RESULT | undefined;
      let error: unknown | undefined;
      let msToFirstChunk: number | undefined = undefined;

      let accumulatedText = '';
      let textDelta = '';
      let fullResponse: {
        id: string;
        timestamp: Date;
        modelId: string;
      } = {
        id: generateId(),
        timestamp: currentDate(),
        modelId: model.modelId,
      };

      let latestObjectJson: JSONValue | undefined = undefined;
      let latestObject: PARTIAL | undefined = undefined;
      let isFirstChunk = true;
      let isFirstDelta = true;

      const transformedStream = stream
        .pipeThrough(new TransformStream(transformer))
        .pipeThrough(
          new TransformStream<
            string | ObjectStreamInputPart,
            ObjectStreamPart<PARTIAL>
          >({
            async transform(chunk, controller): Promise<void> {
              if (typeof chunk === 'object' && chunk.type === 'stream-start') {
                warnings = chunk.warnings;
                return;
              }

              if (isFirstChunk) {
                msToFirstChunk = now() - startTimestampMs;
                isFirstChunk = false;
              }

              if (typeof chunk === 'string') {
                accumulatedText += chunk;
                textDelta += chunk;

                const { value: currentObjectJson, state: parseState } =
                  await parsePartialJson(accumulatedText);

                if (
                  currentObjectJson !== undefined &&
                  !isDeepEqualData(latestObjectJson, currentObjectJson)
                ) {
                  const validationResult =
                    await outputStrategy.validatePartialResult({
                      value: currentObjectJson,
                      textDelta,
                      latestObject,
                      isFirstDelta,
                      isFinalDelta: parseState === 'successful-parse',
                    });

                  if (
                    validationResult.success &&
                    !isDeepEqualData(
                      latestObject,
                      validationResult.value.partial,
                    )
                  ) {
                    latestObjectJson = currentObjectJson;
                    latestObject = validationResult.value.partial;

                    controller.enqueue({
                      type: 'object',
                      object: latestObject,
                    });

                    controller.enqueue({
                      type: 'text-delta',
                      textDelta: validationResult.value.textDelta,
                    });

                    textDelta = '';
                    isFirstDelta = false;
                  }
                }

                return;
              }

              switch (chunk.type) {
                case 'response-metadata': {
                  fullResponse = {
                    id: chunk.id ?? fullResponse.id,
                    timestamp: chunk.timestamp ?? fullResponse.timestamp,
                    modelId: chunk.modelId ?? fullResponse.modelId,
                  };
                  break;
                }

                case 'finish': {
                  if (textDelta !== '') {
                    controller.enqueue({ type: 'text-delta', textDelta });
                  }

                  finishReason = chunk.finishReason.unified;

                  usage = asLanguageModelUsage(chunk.usage);
                  providerMetadata = chunk.providerMetadata;

                  controller.enqueue({
                    ...chunk,
                    finishReason: chunk.finishReason.unified,
                    usage,
                    response: fullResponse,
                  });

                  logWarnings({
                    warnings: warnings ?? [],
                    provider: model.provider,
                    model: model.modelId,
                  });

                  self._usage.resolve(usage);
                  self._providerMetadata.resolve(providerMetadata);
                  self._warnings.resolve(warnings);
                  self._response.resolve({
                    ...fullResponse,
                    headers: response?.headers,
                  });
                  self._finishReason.resolve(finishReason ?? 'other');

                  try {
                    object = await parseAndValidateObjectResultWithRepair(
                      accumulatedText,
                      outputStrategy,
                      repairText,
                      {
                        response: fullResponse,
                        usage,
                        finishReason,
                      },
                    );
                    self._object.resolve(object);
                  } catch (e) {
                    error = e;
                    self._object.reject(e);
                  }
                  break;
                }

                default: {
                  controller.enqueue(chunk);
                  break;
                }
              }
            },

            async flush(controller) {
              try {
                const finalUsage = usage ?? {
                  promptTokens: NaN,
                  completionTokens: NaN,
                  totalTokens: NaN,
                };

                await notify({
                  event: {
                    callId,
                    stepNumber: 0 as const,
                    provider: model.provider,
                    modelId: model.modelId,
                    finishReason: finishReason ?? 'other',
                    usage: finalUsage,
                    objectText: accumulatedText,
                    msToFirstChunk,
                    reasoning: undefined,
                    warnings,
                    request: request ?? {},
                    response: {
                      ...fullResponse,
                      headers: response?.headers,
                    },
                    providerMetadata,
                  },
                  callbacks: [
                    onStepFinish,
                    telemetryDispatcher.onObjectStepFinish,
                  ],
                });

                await notify({
                  event: {
                    callId,
                    object,
                    error,
                    reasoning: undefined,
                    finishReason: finishReason ?? 'other',
                    usage: finalUsage,
                    warnings,
                    request: request ?? {},
                    response: {
                      ...fullResponse,
                      headers: response?.headers,
                    },
                    providerMetadata,
                  },
                  callbacks: [onFinish, telemetryDispatcher.onEnd],
                });
              } catch (error) {
                controller.enqueue({ type: 'error', error });
              }
            },
          }),
        );

      stitchableStream.addStream(transformedStream);
    })()
      .catch(async error => {
        await telemetryDispatcher.onError?.({ callId, error });

        stitchableStream.addStream(
          new ReadableStream({
            start(controller) {
              controller.enqueue({ type: 'error', error });
              controller.close();
            },
          }),
        );
      })
      .finally(() => {
        stitchableStream.close();
      });

    this.outputStrategy = outputStrategy;
  }

  get object() {
    return this._object.promise;
  }

  get usage() {
    return this._usage.promise;
  }

  get providerMetadata() {
    return this._providerMetadata.promise;
  }

  get warnings() {
    return this._warnings.promise;
  }

  get request() {
    return this._request.promise;
  }

  get response() {
    return this._response.promise;
  }

  get finishReason() {
    return this._finishReason.promise;
  }

  get partialObjectStream(): AsyncIterableStream<PARTIAL> {
    return createAsyncIterableStream(
      this.baseStream.pipeThrough(
        new TransformStream<ObjectStreamPart<PARTIAL>, PARTIAL>({
          transform(chunk, controller) {
            switch (chunk.type) {
              case 'object':
                controller.enqueue(chunk.object);
                break;

              case 'text-delta':
              case 'finish':
              case 'error': // 抑制错误（用onError代替）
                break;

              default: {
                const _exhaustiveCheck: never = chunk;
                throw new Error(`Unsupported chunk type: ${_exhaustiveCheck}`);
              }
            }
          },
        }),
      ),
    );
  }

  get elementStream(): ELEMENT_STREAM {
    return this.outputStrategy.createElementStream(this.baseStream);
  }

  get textStream(): AsyncIterableStream<string> {
    return createAsyncIterableStream(
      this.baseStream.pipeThrough(
        new TransformStream<ObjectStreamPart<PARTIAL>, string>({
          transform(chunk, controller) {
            switch (chunk.type) {
              case 'text-delta':
                controller.enqueue(chunk.textDelta);
                break;

              case 'object':
              case 'finish':
              case 'error': // 抑制错误（用onError代替）
                break;

              default: {
                const _exhaustiveCheck: never = chunk;
                throw new Error(`Unsupported chunk type: ${_exhaustiveCheck}`);
              }
            }
          },
        }),
      ),
    );
  }

  get fullStream(): AsyncIterableStream<ObjectStreamPart<PARTIAL>> {
    return createAsyncIterableStream(this.baseStream);
  }

  pipeTextStreamToResponse(response: ServerResponse, init?: ResponseInit) {
    pipeTextStreamToResponse({
      response,
      textStream: this.textStream,
      ...init,
    });
  }

  toTextStreamResponse(init?: ResponseInit): Response {
    return createTextStreamResponse({
      textStream: this.textStream,
      ...init,
    });
  }
}

export type ObjectStreamInputPart =
  | string
  | {
      type: 'stream-start';
      warnings: SharedV4Warning[];
    }
  | {
      type: 'error';
      error: unknown;
    }
  | {
      type: 'response-metadata';
      id?: string;
      timestamp?: Date;
      modelId?: string;
    }
  | {
      type: 'finish';
      finishReason: LanguageModelV4FinishReason;
      usage: LanguageModelV4Usage;
      providerMetadata?: SharedV4ProviderMetadata;
    };
