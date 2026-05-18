import type { JSONObject, LanguageModelV4FunctionTool } from '@ai-sdk/provider';
import type { LanguageModelMiddleware } from '../types';

function defaultFormatExample(example: { input: JSONObject }): string {
  return JSON.stringify(example.input);
}

/**
 * 将输入示例附加到工具描述的中间件。
 *
 * 这对于本身不支持“inputExamples”的提供者很有用
 * 财产。中间件将示例序列化到工具的描述文本中。
 *
 * @param options - Configuration options for the middleware.
 * @param options.prefix - A prefix to prepend before the examples. Default: 'Input Examples:'
 * @param options.format - Optional custom formatter for each example.
 *   接收示例对象及其索引。默认值：JSON.stringify(example.input)
 * @param options.remove - Whether to remove the inputExamples property
 *   将它们添加到描述中后。默认值：true
 *
 * @example
 * ````ts
 * 从“ai”导入{wrapLanguageModel，addToolInputExamplesMiddleware}；
 *
 * 常量模型=wrapLanguageModel({
 *   型号：您的型号，
 *   中间件：addToolInputExamplesMiddleware(),
 * });
 * ```
 */
export function addToolInputExamplesMiddleware({
  prefix = 'Input Examples:',
  format = defaultFormatExample,
  remove = true,
}: {
  /**
   * 在示例之前添加的前缀。
   */
  prefix?: string;

  /**
   * 每个示例的可选自定义格式化程序。
   * 接收示例对象及其索引。
   * 默认值：JSON.stringify(example.input)
   */
  format?: (example: { input: JSONObject }, index: number) => string;

  /**
   * 将 inputExamples 添加到描述后是否删除 inputExamples 属性。
   * 默认值：true
   */
  remove?: boolean;
} = {}): LanguageModelMiddleware {
  return {
    specificationVersion: 'v4',
    transformParams: async ({ params }) => {
      if (!params.tools?.length) {
        return params;
      }

      const transformedTools = params.tools.map(tool => {
        // 仅具有 inputExamples 的变换函数工具
        if (tool.type !== 'function' || !tool.inputExamples?.length) {
          return tool;
        }

        const formattedExamples = tool.inputExamples
          .map((example, index) => format(example, index))
          .join('\n');

        const examplesSection = `${prefix}\n${formattedExamples}`;

        const toolDescription = tool.description
          ? `${tool.description}\n\n${examplesSection}`
          : examplesSection;

        return {
          ...tool,
          description: toolDescription,
          inputExamples: remove ? undefined : tool.inputExamples,
        } satisfies LanguageModelV4FunctionTool;
      });

      return {
        ...params,
        tools: transformedTools,
      };
    },
  };
}
