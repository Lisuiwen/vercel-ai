/**
 * 可以同步提供或作为类似承诺提供的值。
 */
export type MaybePromiseLike<T> =
  | T // 原始值
  | PromiseLike<T>; // 价值承诺
