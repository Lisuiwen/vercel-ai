import { validateTypes, type FlexibleSchema } from '@ai-sdk/provider-utils';
/**
 * 根据工具的可选上下文架构验证工具上下文值。
 *
 * 如果未定义上下文模式，则按原样返回原始上下文值。
 * 否则，上下文将在之前通过模式进行验证和规范化
 * 被传递到工具执行和批准挂钩中。
 *
 * @throws {TypeValidationError} 当提供的工具上下文不匹配时
 * 该工具声明了`contextSchema`。
 */
export async function validateToolContext<CONTEXT>({
  toolName,
  context,
  contextSchema,
}: {
  toolName: string;
  context: unknown;
  contextSchema: FlexibleSchema<CONTEXT> | undefined;
}): Promise<CONTEXT> {
  if (contextSchema == null) {
    return context as CONTEXT;
  }

  return await validateTypes({
    value: context,
    schema: contextSchema,
    context: {
      field: 'tool context',
      entityName: toolName,
    },
  });
}
