import type { Callback } from '../util/callback';

/**
 * 创建一个异步回调，并行调用提供的回调。
 * 跳过未定义的回调，并抛出或拒绝回调错误
 * 被忽略。
 *
 * @param回调为每个事件调用的回调。
 * @returns 将每个事件转发到所有回调并等待的回调
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
