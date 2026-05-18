import { asArray, type Arrayable } from '@ai-sdk/provider-utils';
import type { Callback } from './callback';

/**
 * 并行通知给定事件的所有提供的回调。
 * 回调中的错误不会破坏生成流程。
 */
export async function notify<EVENT>(options: {
  event: EVENT;
  callbacks?: Arrayable<Callback<EVENT> | undefined | null>;
}): Promise<void> {
  await Promise.all(
    asArray(options.callbacks).map(async callback => {
      try {
        await callback?.(options.event);
      } catch {}
    }),
  );
}
