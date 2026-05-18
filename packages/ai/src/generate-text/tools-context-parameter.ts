import type {
  HasRequiredKey,
  InferToolSetContext,
  ToolSet,
} from '@ai-sdk/provider-utils';

/**
 * 检查工具上下文映射是否包含任何上下文工具条目。
 */
type IsEmptyObject<OBJECT> = keyof OBJECT extends never ? true : false;

/**
 * 使toolsContext参数成为可选、必需或可选的帮助程序类型
 * 根据工具集不可用。
 */
export type ToolsContextParameter<TOOLS extends ToolSet> = {
  tools?: TOOLS;
} & (IsEmptyObject<InferToolSetContext<TOOLS>> extends true
  ? { toolsContext?: never }
  : HasRequiredKey<InferToolSetContext<TOOLS>> extends true
    ? { toolsContext: InferToolSetContext<TOOLS> }
    : { toolsContext?: InferToolSetContext<TOOLS> });
