import type { JSONValue } from '@ai-sdk/provider';
import {
  createIdGenerator,
  withUserAgentSuffix,
  type FlexibleSchema,
  type InferSchema,
  type ProviderOptions,
} from '@ai-sdk/provider-utils';
import { NoObjectGeneratedError } from '../error/no-object-generated-error';
import { extractReasoningContent } from '../generate-text/extract-reasoning-content';
import { extractTextContent } from '../generate-text/extract-text-content';
import { logWarnings } from '../logger/log-warnings';
import { resolveLanguageModel } from '../model/resolve-model';
import { convertToLanguageModelPrompt } from '../prompt/convert-to-language-model-prompt';
import type { LanguageModelCallOptions } from '../prompt/language-model-call-options';
import { prepareLanguageModelCallOptions } from '../prompt/prepare-language-model-call-options';
import type { Prompt } from '../prompt/prompt';
import type { RequestOptions } from '../prompt/request-options';
import { standardizePrompt } from '../prompt/standardize-prompt';
import { wrapGatewayError } from '../prompt/wrap-gateway-error';
import { createTelemetryDispatcher } from '../telemetry/create-telemetry-dispatcher';
import type { TelemetryOptions } from '../telemetry/telemetry-options';
import type { LanguageModel } from '../types/language-model';
import type { LanguageModelRequestMetadata } from '../types/language-model-request-metadata';
import type { LanguageModelResponseMetadata } from '../types/language-model-response-metadata';
import { asLanguageModelUsage } from '../types/usage';
import type { Callback } from '../util/callback';
import type { DownloadFunction } from '../util/download/download-function';
import { notify } from '../util/notify';
import { prepareHeaders } from '../util/prepare-headers';
import { prepareRetries } from '../util/prepare-retries';
import { VERSION } from '../version';
import type { GenerateObjectResult } from './generate-object-result';
import { getOutputStrategy } from './output-strategy';
import { parseAndValidateObjectResultWithRepair } from './parse-and-validate-object-result';
import type { RepairTextFunction } from './repair-text';
import type {
  GenerateObjectEndEvent,
  GenerateObjectStartEvent,
  GenerateObjectStepEndEvent,
  GenerateObjectStepStartEvent,
} from './structured-output-events';
import { validateObjectGenerationInput } from './validate-object-generation-input';

const originalGenerateId = createIdGenerator({ prefix: 'aiobj', size: 24 });

/**
 * 使用语言模型为给定的提示和模式生成结构化、类型化的对象。
 *
 * 此函数不是流式输出。如果您想流式传输输出，请改用`streamObject`。
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
 * @param experimental_repairText - 尝试修复模型原始输出的函数
 * 启用JSON解析。
 *
 * @param telemetry - 可选遥测配置。
 *
 * @param providerOptions - 其他特定于提供商的选项。他们通过
 * 从AI SDK发送给成功并实现特定的成功
 * 可以完全封装在提供者中的功能。
 *
 * @param experimental_onStart - 生成开始时、LLM 调用之前调用的回调。
 * @param experimental_onStepStart - 模型调用开始时调用回调。
 * @param onStepFinish - 当模型调用完成并显示原始结果时调用回调。
 * @param onFinish - 当解析对象的整个操作完成时调用回调。
 *
 * @返回
 * 一个结果对象，包含生成的对象、完成原因、令牌使用情况和其他信息。
 *
 * @deprecated 请使用带标记的`output`设置的`generateText`。
 */
export async function generateObject<
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
       * 当generateObject操作开始时调用的回调，
       * 在拨打LLM电话之前。
       */
      experimental_onStart?: Callback<GenerateObjectStartEvent>;

      /**
       * 模型调用（步骤）开始时调用的回调，
       * 在调用提供者之前。
       */
      experimental_onStepStart?: Callback<GenerateObjectStepStartEvent>;

      /**
       * 模型调用（步骤）完成时调用的回调，
       * 与JSON解析之前的原始结果。
       */
      onStepFinish?: Callback<GenerateObjectStepEndEvent>;

      /**
       * 整个操作完成时调用的回调
       * 以及最终解析和验证的对象。
       */
      onFinish?: Callback<GenerateObjectEndEvent<RESULT>>;

      /**
       * 内部的。仅供测试使用。可能会更改，恕不另行通知。
       */
      _internal?: {
        generateId?: () => string;
        currentDate?: () => Date;
      };
    },
): Promise<GenerateObjectResult<RESULT>> {
  const {
    model: modelArg,
    output = 'object',
    instructions,
    system,
    prompt,
    messages,
    allowSystemInMessages,
    maxRetries: maxRetriesArg,
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
    onFinish,
    _internal: {
      generateId = originalGenerateId,
      currentDate = () => new Date(),
    } = {},
    ...settings
  } = options;

  const model = resolveLanguageModel(modelArg);

  const enumValues = 'enum' in options ? options.enum : undefined;
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

  const { maxRetries, retry } = prepareRetries({
    maxRetries: maxRetriesArg,
    abortSignal,
  });

  const outputStrategy = getOutputStrategy({
    output,
    schema: inputSchema,
    enumValues,
  });

  const callSettings = prepareLanguageModelCallOptions(settings);

  const headersWithUserAgent = withUserAgentSuffix(
    headers ?? {},
    `ai/${VERSION}`,
  );

  const telemetryDispatcher = createTelemetryDispatcher({
    telemetry,
  });

  const jsonSchema = await outputStrategy.jsonSchema();
  const callId = generateId();

  await notify({
    event: {
      callId,
      operationId: 'ai.generateObject' as const,
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
      headers: headersWithUserAgent,
      providerOptions,
      output: outputStrategy.type as 'object' | 'array' | 'enum' | 'no-schema',
      schema: jsonSchema as Record<string, unknown> | undefined,
      schemaName,
      schemaDescription,
    },
    callbacks: [onStart, telemetryDispatcher.onStart],
  });

  try {
    const standardizedPrompt = await standardizePrompt({
      instructions,
      system,
      prompt,
      messages,
      allowSystemInMessages,
    } as Prompt);

    const promptMessages = await convertToLanguageModelPrompt({
      prompt: standardizedPrompt,
      supportedUrls: await model.supportedUrls,
      download,
      provider: model.provider.split('.')[0],
    });

    await notify({
      event: {
        callId,
        stepNumber: 0 as const,
        provider: model.provider,
        modelId: model.modelId,
        providerOptions,
        headers: headersWithUserAgent,
        promptMessages,
      },
      callbacks: [onStepStart, telemetryDispatcher.onObjectStepStart],
    });

    const generateResult = await retry(() =>
      model.doGenerate({
        responseFormat: {
          type: 'json',
          schema: jsonSchema,
          name: schemaName,
          description: schemaDescription,
        },
        ...prepareLanguageModelCallOptions(settings),
        prompt: promptMessages,
        providerOptions,
        abortSignal,
        headers: headersWithUserAgent,
      }),
    );

    const responseData = {
      id: generateResult.response?.id ?? generateId(),
      timestamp: generateResult.response?.timestamp ?? currentDate(),
      modelId: generateResult.response?.modelId ?? model.modelId,
      headers: generateResult.response?.headers,
      body: generateResult.response?.body,
    };

    const text = extractTextContent(generateResult.content);
    const reasoning = extractReasoningContent(generateResult.content);

    if (text === undefined) {
      throw new NoObjectGeneratedError({
        message: 'No object generated: the model did not return a response.',
        response: responseData,
        usage: asLanguageModelUsage(generateResult.usage),
        finishReason: generateResult.finishReason.unified,
      });
    }

    const finishReason = generateResult.finishReason.unified;
    const usage = asLanguageModelUsage(generateResult.usage);
    const warnings = generateResult.warnings;
    const resultProviderMetadata = generateResult.providerMetadata;
    const request: Omit<LanguageModelRequestMetadata, 'messages'> =
      generateResult.request ?? {};
    const response: Omit<LanguageModelResponseMetadata, 'messages'> =
      responseData;

    logWarnings({
      warnings,
      provider: model.provider,
      model: model.modelId,
    });

    const stepFinishEvent: GenerateObjectStepEndEvent = {
      callId,
      stepNumber: 0 as const,
      provider: model.provider,
      modelId: model.modelId,
      finishReason,
      usage,
      objectText: text,
      msToFirstChunk: undefined,
      reasoning,
      warnings,
      request,
      response,
      providerMetadata: resultProviderMetadata,
    };

    await notify({
      event: stepFinishEvent,
      callbacks: [onStepFinish, telemetryDispatcher.onObjectStepFinish],
    });

    const object = await parseAndValidateObjectResultWithRepair(
      text,
      outputStrategy,
      repairText,
      {
        response,
        usage,
        finishReason,
      },
    );

    await notify({
      event: {
        callId,
        object,
        error: undefined,
        reasoning,
        finishReason,
        usage,
        warnings,
        request,
        response,
        providerMetadata: resultProviderMetadata,
      },
      callbacks: [onFinish, telemetryDispatcher.onEnd],
    });

    return new DefaultGenerateObjectResult({
      object,
      reasoning,
      finishReason,
      usage,
      warnings,
      request,
      response,
      providerMetadata: resultProviderMetadata,
    });
  } catch (error) {
    await telemetryDispatcher.onError?.({ callId, error });
    throw wrapGatewayError(error);
  }
}

class DefaultGenerateObjectResult<T> implements GenerateObjectResult<T> {
  readonly object: GenerateObjectResult<T>['object'];
  readonly finishReason: GenerateObjectResult<T>['finishReason'];
  readonly usage: GenerateObjectResult<T>['usage'];
  readonly warnings: GenerateObjectResult<T>['warnings'];
  readonly providerMetadata: GenerateObjectResult<T>['providerMetadata'];
  readonly response: GenerateObjectResult<T>['response'];
  readonly request: GenerateObjectResult<T>['request'];
  readonly reasoning: GenerateObjectResult<T>['reasoning'];

  constructor(options: {
    object: GenerateObjectResult<T>['object'];
    finishReason: GenerateObjectResult<T>['finishReason'];
    usage: GenerateObjectResult<T>['usage'];
    warnings: GenerateObjectResult<T>['warnings'];
    providerMetadata: GenerateObjectResult<T>['providerMetadata'];
    response: GenerateObjectResult<T>['response'];
    request: GenerateObjectResult<T>['request'];
    reasoning: GenerateObjectResult<T>['reasoning'];
  }) {
    this.object = options.object;
    this.finishReason = options.finishReason;
    this.usage = options.usage;
    this.warnings = options.warnings;
    this.providerMetadata = options.providerMetadata;
    this.response = options.response;
    this.request = options.request;
    this.reasoning = options.reasoning;
  }

  toJsonResponse(init?: ResponseInit): Response {
    return new Response(JSON.stringify(this.object), {
      status: init?.status ?? 200,
      headers: prepareHeaders(init?.headers, {
        'content-type': 'application/json; charset=utf-8',
      }),
    });
  }
}
