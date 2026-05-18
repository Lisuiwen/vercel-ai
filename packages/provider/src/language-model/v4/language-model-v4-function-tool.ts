import type { JSONSchema7 } from 'json-schema';
import type { SharedV4ProviderOptions } from '../../shared';
import type { JSONObject } from '../../json-value';

/**
 * 工具具有名称、描述和一组参数。
 *
 * 注意：这不是面向用户的工具定义。 AI SDK 方法将
 * 将面向用户的工具定义映射到此格式。
 */
export type LanguageModelV4FunctionTool = {
  /**
   * 工具的类型（始终为“功能”）。
   */
  type: 'function';

  /**
   * 工具的名称。在该模型调用中是独一无二的。
   */
  name: string;

  /**
   * 该工具的描述。语言模型使用它来理解
   * 工具的目的并提供更好的完成建议。
   */
  description?: string;

  /**
   * 该工具期望的参数。语言模型使用它来
   * 了解工具的输入要求并提供匹配建议。
   */
  inputSchema: JSONSchema7;

  /**
   * 显示语言的输入示例的可选列表
   * 对输入应该是什么样子进行建模。
   */
  inputExamples?: Array<{ input: JSONObject }>;

  /**
   * 工具的严格模式设置。
   *
   * 支持严格模式的提供商将使用此设置来确定
   * 如何生成输入。严格模式总会产生
   * 有效的输入，但它可能会限制支持的输入模式。
   */
  strict?: boolean;

  /**
   * 该工具的特定于提供商的选项。
   */
  providerOptions?: SharedV4ProviderOptions;
};
