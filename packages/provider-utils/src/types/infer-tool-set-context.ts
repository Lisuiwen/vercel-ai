import type { InferToolContext } from './infer-tool-context';
import type { ToolSet } from './tool-set';

/**
 * 为其上下文构建工具上下文映射的所需部分
 * 类型不包括“未定义”。
 */
type RequiredToolSetContext<TOOLS extends ToolSet> = {
  [K in keyof TOOLS as InferToolContext<NoInfer<TOOLS[K]>> extends never
    ? never
    : undefined extends InferToolContext<NoInfer<TOOLS[K]>>
      ? never
      : K]: InferToolContext<NoInfer<TOOLS[K]>>;
};

/**
 * 为其上下文构建工具上下文映射的可选部分
 * 对象本身可能是“未定义”。
 */
type OptionalToolSetContext<TOOLS extends ToolSet> = {
  [K in keyof TOOLS as InferToolContext<NoInfer<TOOLS[K]>> extends never
    ? never
    : undefined extends InferToolContext<NoInfer<TOOLS[K]>>
      ? K
      : never]?: InferToolContext<NoInfer<TOOLS[K]>>;
};

/**
 * 展平相交的映射类型，以便输入相等断言和编辑器
 * 悬停显示最终的对象形状。
 */
type Normalize<OBJECT> = { [KEY in keyof OBJECT]: OBJECT[KEY] };

/**
 * 推断工具集的上下文类型。
 *
 * 推断的类型将每个上下文工具名称映射到其上下文类型。
 *
 * 没有具体上下文的工具被省略。工具上下文包括
 * “未定义”表示为可选属性。
 */
export type InferToolSetContext<TOOLS extends ToolSet> = Normalize<
  RequiredToolSetContext<TOOLS> & OptionalToolSetContext<TOOLS>
>;
