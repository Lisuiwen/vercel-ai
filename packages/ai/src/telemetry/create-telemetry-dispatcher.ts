import { asArray } from '@ai-sdk/provider-utils';
import type { Callback } from '../util/callback';
import { mergeCallbacks } from '../util/merge-callbacks';
import type {
  InferTelemetryEvent,
  Telemetry,
  TelemetryDispatcher,
} from './telemetry';
import { type TelemetryDiagnosticEventType } from './diagnostic-channel';
import { publishTelemetryDiagnosticChannelMessage } from './diagnostic-channel-publisher';
import { getGlobalTelemetryIntegrations } from './telemetry-registry';
import type { TelemetryOptions } from './telemetry-options';

/**
 * `TelemetryDispatcher` 键的子集，其值为 Callback 回调。
 * 这不包括非回调属性，例如`executeTool`。
 */
type TelemetryCallbackKey = keyof {
  [K in keyof TelemetryDispatcher as TelemetryDispatcher[K] extends
    | Callback<any>
    | undefined
    ? K
    : never]: true;
};

/**
 * 解析遥测回调键接受的公共事件类型。
 */
type TelemetryEvent<K extends TelemetryCallbackKey> =
  TelemetryDispatcher[K] extends Callback<infer EVENT> | undefined
    ? EVENT
    : never;

function augmentEvent<EVENT>(
  event: EVENT,
  telemetry: Pick<
    TelemetryOptions,
    'recordInputs' | 'recordOutputs' | 'functionId'
  >,
): InferTelemetryEvent<EVENT> {
  return Object.assign(
    Object.create(Object.getPrototypeOf(event)),
    event,
    telemetry,
  );
}

/**
 * 创建发送遥测事件的遥测调度程序
 * 到已解决的集成集。
 *
 * 当提供每次调用集成时，它们优先于全局集成
 * 为该调用注册了集成。当没有每次调用集成时
 * 前提是使用全局注册的集成。
 *
 * @param args.telemetry - 可选的每次呼叫遥测设置和集成。
 *
 * @returns 遥测调度程序，将生命周期事件扇出到
 * 解决了一组集成。
 */
export function createTelemetryDispatcher({
  telemetry,
}: {
  telemetry?: TelemetryOptions;
  // 操作ID：字符串；
}): TelemetryDispatcher {
  // 当遥测被明确禁用时，返回调度程序
  // 不执行任何工作并让工具执行以未包装方式通过。
  if (telemetry?.isEnabled === false) {
    return {};
  }

  const localIntegrations = telemetry?.integrations;
  const integrations: Array<Telemetry> =
    localIntegrations != null
      ? asArray(localIntegrations)
      : getGlobalTelemetryIntegrations();

  const telemetryMetadata = {
    recordInputs: telemetry?.recordInputs,
    recordOutputs: telemetry?.recordOutputs,
    functionId: telemetry?.functionId,
  };

  const mergeTelemetryCallback = <KEY extends TelemetryCallbackKey>(
    key: KEY,
  ): Callback<TelemetryEvent<KEY>> => {
    // 事件数据现在自动发布到诊断通道
    const publishDiagnosticChannelMessage = ((event: TelemetryEvent<KEY>) =>
      publishTelemetryDiagnosticChannelMessage({
        type: key as TelemetryDiagnosticEventType,
        event: augmentEvent(event, telemetryMetadata),
      })) as Callback<TelemetryEvent<KEY>>;

    return mergeCallbacks(
      publishDiagnosticChannelMessage,
      ...(
        integrations
          .map(integration => integration[key]?.bind(integration))
          .filter(Boolean) as Array<
          Callback<InferTelemetryEvent<TelemetryEvent<KEY>>>
        >
      ).map(
        callback =>
          ((event: TelemetryEvent<KEY>) =>
            callback(augmentEvent(event, telemetryMetadata))) as Callback<
            TelemetryEvent<KEY>
          >,
      ),
    );
  };

  const executeWrappers = integrations
    .map(integration => integration.executeTool?.bind(integration))
    .filter(Boolean) as Array<NonNullable<Telemetry['executeTool']>>;

  return {
    onStart: mergeTelemetryCallback('onStart'),
    onStepStart: mergeTelemetryCallback('onStepStart'),
    onLanguageModelCallStart: mergeTelemetryCallback(
      'onLanguageModelCallStart',
    ),
    onLanguageModelCallEnd: mergeTelemetryCallback('onLanguageModelCallEnd'),
    onToolExecutionStart: mergeTelemetryCallback('onToolExecutionStart'),
    onToolExecutionEnd: mergeTelemetryCallback('onToolExecutionEnd'),
    onStepFinish: mergeTelemetryCallback('onStepFinish'),
    onObjectStepStart: mergeTelemetryCallback('onObjectStepStart'),
    onObjectStepFinish: mergeTelemetryCallback('onObjectStepFinish'),
    onEmbedStart: mergeTelemetryCallback('onEmbedStart'),
    onEmbedEnd: mergeTelemetryCallback('onEmbedEnd'),
    onRerankStart: mergeTelemetryCallback('onRerankStart'),
    onRerankEnd: mergeTelemetryCallback('onRerankEnd'),
    onEnd: mergeTelemetryCallback('onEnd'),
    onError: mergeTelemetryCallback('onError'),

    /**
     * 围绕原始工具执行组成所有`executeTool`包装器。
     * 每个包装器接收一个“执行”函数，该函数调用下一个包装器
     * 链，因此集成可以在之前建立嵌套遥测上下文
     * 委托给底层工具。
     */
    executeTool:
      executeWrappers.length > 0
        ? async args => {
            let execute = args.execute;
            for (const executeWrapper of executeWrappers) {
              const innerExecute = execute;
              execute = () =>
                executeWrapper({ ...args, execute: innerExecute });
            }
            return await execute();
          }
        : undefined,
  };
}
