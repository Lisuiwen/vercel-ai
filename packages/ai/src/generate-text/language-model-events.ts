import type { ToolSet } from '@ai-sdk/provider-utils';
import type { Callback } from '../util/callback';
import type { FinishReason } from '../types/language-model';
import type { LanguageModelUsage } from '../types/usage';
import type { ContentPart } from './content-part';
import type { StandardizedPrompt } from '../prompt/standardize-prompt';
import type { LanguageModelCallOptions } from '../prompt';

/**
 * 跨回调事件使用的通用模型信息。
 */
export type ModelInfo = {
  /* * 提供者标识符（例如`openai`、`anthropic`）。 */
  readonly provider: string;
  /* * 特定型号标识符（例如`gpt-4o`）。 */
  readonly modelId: string;
};

/**
 * 事件传递给`onLanguageModelCallStart`回调。
 *
 * 在提供者模型调用开始之前立即调用。
 * 与`onStepStart`不同，这仅代表模型调用工作。
 */
export type LanguageModelCallStartEvent = ModelInfo & {
  /* * 本次生成调用的唯一标识符，用于关联事件。 */
  readonly callId: string;

  /* * 为模型调用准备工具定义（如果有）。 */
  readonly tools: ReadonlyArray<Record<string, unknown>> | undefined;
} & StandardizedPrompt &
  LanguageModelCallOptions;

/**
 * 事件传递给`onLanguageModelCallEnd`回调。
 *
 * 在模型响应标准化和解析之后但之前调用
 * 任何客户端工具开始执行。
 */
export type LanguageModelCallEndEvent<TOOLS extends ToolSet = ToolSet> =
  ModelInfo & {
    /* * 本次生成调用的唯一标识符，用于关联事件。 */
    readonly callId: string;

    /* * 模型调用完成的统一原因。 */
    readonly finishReason: FinishReason;

    /* * 模型调用报告的令牌使用情况。 */
    readonly usage: LanguageModelUsage;

    /* * 模型调用产生的内容部分。 */
    readonly content: ReadonlyArray<ContentPart<TOOLS>>;

    /* * 提供者用于模型调用返回的响应ID。 */
    readonly responseId: string;

    /* * 模型调用的性能指标。 */
    readonly performance: {
      /* * 等待语言模型响应所花费的时间（以毫秒为单位）。 */
      readonly responseTimeMs: number;

      /**
       * 完整语言每秒输出令牌的有效数量
       * 模型响应。
       */
      readonly effectiveOutputTokensPerSecond: number;

      /**
       * 第一个输出令牌后每秒输出令牌的数量
       * 收到。
       *
       * 仅适用于流媒体通话。
       */
      readonly outputTokensPerSecond: number | undefined;

      /**
       * 第一次输出之前每秒处理的输入令牌数
       * 收到令牌。
       *
       * 仅适用于流媒体通话。
       */
      readonly inputTokensPerSecond: number | undefined;

      /**
       * 每秒输入和输出令牌的有效数量
       * 语言模型响应。
       */
      readonly effectiveTotalTokensPerSecond: number;

      /**
       * 收到第一个文本、推理或工具输入增量之前的时间
       * 以毫秒为单位。
       */
      readonly timeToFirstOutputTokenMs: number | undefined;
    };
  };

/**
 * 使用`experimental_onLanguageModelCallStart`选项设置的回调。
 *
 * 在提供者模型调用开始之前立即调用。
 * 与逐步启动回调不同，这仅限于模型工作并且
 * 排除任何后续的客户端工具执行。
 *
 * @param event - 包含特定于模型调用的输入的事件对象。
 */
export type OnLanguageModelCallStartCallback =
  Callback<LanguageModelCallStartEvent>;

/**
 * 使用`experimental_onLanguageModelCallEnd`选项设置的回调。
 *
 * 在模型响应标准化和解析之后但之前调用
 * 任何客户端工具开始执行。
 *
 * @param event - 包含特定于模型调用的输出的事件对象。
 */
export type OnLanguageModelCallEndCallback<TOOLS extends ToolSet = ToolSet> =
  Callback<LanguageModelCallEndEvent<TOOLS>>;
