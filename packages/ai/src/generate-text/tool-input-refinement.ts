import type {
  InferToolInput,
  MaybePromiseLike,
  ToolSet,
} from '@ai-sdk/provider-utils';

/**
 * 将工具名称映射到优化已解析工具输入的函数。
 *
 * 每个细化函数接收其工具的类型化输入，并且必须返回
 * 具有相同类型形状的输入。精致的输入用于工具执行，
 * 输出部分、生命周期回调和遥测。
 */
export type ToolInputRefinement<TOOLS extends ToolSet> = {
  [NAME in keyof TOOLS]?: (
    input: InferToolInput<TOOLS[NAME]>,
  ) => MaybePromiseLike<InferToolInput<TOOLS[NAME]>>;
};
