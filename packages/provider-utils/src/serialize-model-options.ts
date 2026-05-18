import type { JSONObject } from '@ai-sdk/provider';
import { isJSONSerializable } from './is-json-serializable';
import type { Resolvable } from './resolve';

/**
 * 序列化工作流步骤边界的模型实例。
 * 返回“modelId”以及 JSON 可序列化的配置属性。
 *
 * 省略不可序列化的值。作为一个特例，一个
 * 函数值“headers”属性在序列化期间解析
 * 如果返回值是 JSON 可序列化的，则包含在内。
 *
 * 用作提供程序模型中“静态 [WORKFLOW_SERIALIZE]”的主体。
 *
 * @example
 * ````ts
 * 静态 [WORKFLOW_SERIALIZE]（模型：MyLanguageModel）{
 *   返回序列化模型选项（{
 *     modelId: model.modelId,
 *     配置：模型.config，
 *   });
 * }
 * ```
 */
export function serializeModelOptions<
  CONFIG extends {
    headers?: Resolvable<Record<string, string | undefined>>;
  },
>(options: {
  modelId: string;
  config: CONFIG;
}): {
  modelId: string;
  config: JSONObject;
} {
  const serializableConfig: JSONObject = {};
  for (const [key, value] of Object.entries(options.config)) {
    if (key === 'headers') {
      const resolvedHeaders = resolveSync(value);
      if (isJSONSerializable(resolvedHeaders)) {
        serializableConfig[key] = resolvedHeaders;
      }
    } else if (isJSONSerializable(value)) {
      serializableConfig[key] = value;
    }
  }
  return { modelId: options.modelId, config: serializableConfig };
}

function resolveSync<T>(value: Resolvable<T>): T {
  let next: unknown = value;
  if (typeof value === 'function') {
    next = (value as () => unknown)();
  }

  // 工作流的序列化当前仅支持同步值
  // TODO介绍SerializationError
  if (next instanceof Promise) {
    throw new Error('Promise returned from resolveSync');
  }

  return next as T;
}
