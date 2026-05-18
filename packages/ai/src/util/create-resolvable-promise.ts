import type { ErrorHandler } from './error-handler';

/**
 * 创建一个具有外部可访问的解析和拒绝函数的Promise。
 *
 * @template T - Promise 将解析为的值的类型。
 * @returns 一个对象包含：
 * - 承诺：可以在外部解决或拒绝的承诺。
 * -resolve：用 T 类型的值解析 Promise 的函数。
 * -reject：一个函数，用于拒绝带有错误的Promise。
 */
export function createResolvablePromise<T = any>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: ErrorHandler;
} {
  let resolve: (value: T) => void;
  let reject: ErrorHandler;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}
