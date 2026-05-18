import type { JSONSchema7 } from 'json-schema';
import type { SharedV2ProviderOptions } from '../../shared';

/**
 * 工具具有名称、描述和一组参数。
 *
 * 注意：这不是面向用户的工具定义。 AI SDK 方法将
 * 将面向用户的工具定义映射到此格式。
 */
export type LanguageModelV2FunctionTool = {
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
   * 该工具的特定于提供商的选项。
   */
  providerOptions?: SharedV2ProviderOptions;
};
