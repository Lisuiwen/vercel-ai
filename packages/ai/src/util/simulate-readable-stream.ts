import { delay as delayFunction } from '@ai-sdk/provider-utils';

/**
 * 创建一个 ReadableStream，它发出提供的值，每个值之间有一个可选的延迟。
 *
 * @param options - 配置选项
 * @param options.chunks - 由流发出的值的数组
 * @param options.initialDelayInMs - 发出第一个值之前的可选初始延迟（以毫秒为单位）（默认值：0）。可以设置为`null`以跳过初始延迟。 `initialDelayInMs: null` 和 `initialDelayInMs: 0` 之间的区别在于，`initialDelayInMs: null` 将无任何延迟地发出值，而 `initialDelayInMs: 0` 将延迟 0 毫秒发出值。
 * @param options.chunkDelayInMs - 发出每个值之间的可选延迟（以毫秒为单位）（默认值：0）。可以设置为`null`来跳过延迟。 `chunkDelayInMs: null` 和 `chunkDelayInMs: 0` 之间的区别在于，`chunkDelayInMs: null` 将无任何延迟地发出值，而 `chunkDelayInMs: 0` 将延迟 0 毫秒发出值。
 * @returns 发出提供的值的 ReadableStream
 */
export function simulateReadableStream<T>({
  chunks,
  initialDelayInMs = 0,
  chunkDelayInMs = 0,
  _internal,
}: {
  chunks: T[];
  initialDelayInMs?: number | null;
  chunkDelayInMs?: number | null;
  _internal?: {
    delay?: (ms: number | null) => Promise<void>;
  };
}): ReadableStream<T> {
  const delay = _internal?.delay ?? delayFunction;

  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      if (index < chunks.length) {
        await delay(index === 0 ? initialDelayInMs : chunkDelayInMs);
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
}
