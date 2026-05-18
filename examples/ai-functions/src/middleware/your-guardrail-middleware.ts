import type {
  LanguageModelV3Content,
  LanguageModelV3Middleware,
} from '@ai-sdk/provider';

export const yourGuardrailMiddleware: LanguageModelV3Middleware = {
  specificationVersion: 'v3',
  wrapGenerate: async ({ doGenerate }) => {
    const { content, ...rest } = await doGenerate();

    // 过滤方法，例如对于 PII 或其他敏感信息：
    const cleanedContent: Array<LanguageModelV3Content> = content.map(part => {
      return part.type === 'text'
        ? {
            type: 'text',
            text: part.text.replace(/badword/g, '<REDACTED>'),
          }
        : part;
    });

    return {
      content: cleanedContent,
      ...rest,
    };
  },

  // 在这里您将实现流式传输的护栏逻辑
  // 注意：流式护栏很难实现，因为
  // 在流结束之前您不知道流的完整内容。
};
