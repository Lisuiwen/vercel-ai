import type { MaybePromiseLike } from './maybe-promise-like';

/**
 * 值或值的惰性提供者，其中每一个都可以是同步的或异步的。
 *
 * @template T The resolved type after {@link resolve} runs.
 *
 * 其中之一：
 * - {@link T} 类型的普通值
 * - {@link T} 的 {@link PromiseLike} （例如 `Promise<T>`）
 * - 一个零参数函数，返回一个简单的 {@link T}
 * - 一个零参数函数，返回 {@link PromiseLike} 的 {@link T}
 *
 * 函数形式仅在传递给{@linkresolve}时才会被调用；它不区分于
 * {@link T} 恰好是一个函数——如果消除歧义，调用者应该包装函数值
 * 是必需的。
 */
export type Resolvable<T> = MaybePromiseLike<T> | (() => MaybePromiseLike<T>);

/**
 * 解析可能是原始值、Promise、返回值的函数的值，
 * 或返回 Promise 的函数。
 */
export async function resolve<T>(value: Resolvable<T>): Promise<T> {
  // 如果它是一个函数，则调用它来获取值/承诺
  if (typeof value === 'function') {
    value = (value as Function)();
  }

  // 否则就解决我们得到的任何东西（价值或承诺）
  return Promise.resolve(value as T);
}
