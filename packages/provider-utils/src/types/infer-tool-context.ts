import type { Context } from './context';
import type { Tool } from './tool';

/**
 * 检测“any”类型，因此无类型工具可以被视为没有显式工具
 * 上下文类型。
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * 检测精确的空对象上下文，包括“{}”与
 * “未定义”，不提供特定于工具的上下文属性。
 */
type IsEmptyObject<T> = keyof NonNullable<T> extends never ? true : false;

/**
 * 检测来自省略或广泛上下文声明的上下文类型
 * 而不是具体的工具上下文模式。
 */
type IsUntypedContext<CONTEXT> =
  IsAny<CONTEXT> extends true
    ? true
    : unknown extends CONTEXT
      ? true
      : IsEmptyObject<CONTEXT> extends true
        ? true
        : string extends keyof CONTEXT
          ? CONTEXT extends Context
            ? true
            : false
          : false;

/**
 * 推断工具的上下文类型。
 */
export type InferToolContext<TOOL extends Tool> =
  TOOL extends Tool<any, any, infer CONTEXT>
    ? IsUntypedContext<CONTEXT> extends true
      ? never
      : CONTEXT
    : never;
