import type { Callback } from '../util/callback';

/**
 * 创建一个异步回调，并行调用提供的回调。
 * 跳过未定义的回调，并抛出或拒绝回调错误
 * 被忽略。
 *
 * @param callbacks The callbacks to invoke for each event.
 * @returns A callback that forwards each event to all callbacks and waits for
 * 他们去解决。
 */
export function mergeCallbacks<EVENT>(
  ...callbacks: Array<Callback<EVENT> | undefined>
): Callback<EVENT> {
  return async (event: EVENT) => {
    await Promise.allSettled(
      callbacks.map(async callback => {
        await callback?.(event);
      }),
    );
  };
}
