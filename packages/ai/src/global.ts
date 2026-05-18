import type { ProviderV2, ProviderV3, ProviderV4 } from '@ai-sdk/provider';
import type { LogWarningsFunction } from './logger/log-warnings';
import type { Telemetry } from './telemetry/telemetry';

// 将AI SDK默认提供者添加到globalThis对象中
declare global {
  /**
   * 用于 AI SDK 的默认提供程序。
   * 字符串模型 ID 解析为默认提供者和模型 ID。
   *
   * 如果未设置，默认提供商是 Vercel AI 网关提供商。
   *
   * @see https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration
   */
  var AI_SDK_DEFAULT_PROVIDER: ProviderV4 | ProviderV3 | ProviderV2 | undefined;

  /**
   * 用于 AI SDK 的警告记录器。
   *
   * 如果未设置，默认记录器是 console.warn 函数。
   *
   * 如果设置为 false，则不会记录任何警告。
   */
  var AI_SDK_LOG_WARNINGS: LogWarningsFunction | undefined | false;

  /**
   * AI SDK 的全球注册遥测集成。
   *
   * 此处注册的集成接收生命周期事件（onStart、onStepStart、
   * 等）来自每个“generateText”、“streamText”和类似的调用。
   *
   * 更喜欢使用“ai”中的“registerTelemetry()”而不是
   * 直接分配这个。
   */
  var AI_SDK_TELEMETRY_INTEGRATIONS: Telemetry[] | undefined;
}
