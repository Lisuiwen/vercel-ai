import type {
  CallWarning,
  FinishReason,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata,
  ProviderMetadata,
} from '../types';
import type { LanguageModelUsage } from '../types/usage';

/**
 * `generateObject` 调用的结果。
 */
export interface GenerateObjectResult<OBJECT> {
  /**
   * 生成的对象（根据模式键入）。
   */
  readonly object: OBJECT;

  /**
   * 用于生成对象的推理。
   * 由所有推理部分连接而成。
   */
  readonly reasoning: string | undefined;

  /**
   * 一代完结的原因。
   */
  readonly finishReason: FinishReason;

  /**
   * 生成的响应的令牌使用情况。
   */
  readonly usage: LanguageModelUsage;

  /**
   * 来自模型提供商的警告（例如不支持的设置）。
   */
  readonly warnings: CallWarning[] | undefined;

  /**
   * 附加请求信息。
   */
  readonly request: Omit<LanguageModelRequestMetadata, 'messages'>;

  /**
   * 附加响应信息。
   */
  readonly response: Omit<LanguageModelResponseMetadata, 'messages'>;

  /**
   * 其他特定于提供商的元数据。他们通过
   * 从成功到AI SDK并实现成功特定的
   * 可以完全封装在提供者中的结果。
   */
  readonly providerMetadata: ProviderMetadata | undefined;

  /**
   * 将对象转换为 JSON 响应。
   * 响应的状态代码为200，内容类型为`application/json;`字符集=utf-8`。
   */
  toJsonResponse(init?: ResponseInit): Response;
}
