/**
 * 结合了 AsyncIterable 和 ReadableStream 的类型。
 * 这允许使用 for-await-of 语法来使用 ReadableStream。
 */
export type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

/**
 * 包装 ReadableStream 并返回一个既是 ReadableStream 又是 AsyncIterable 的对象。
 * 这使得可以使用 for-await-of 来消耗流，并在提前退出或出错时进行适当的资源清理。
 *
 * @template T The type of the stream's chunks.
 * @param source The source ReadableStream to wrap.
 * @returns An AsyncIterableStream that can be used as both a ReadableStream and an AsyncIterable.
 */
export function createAsyncIterableStream<T>(
  source: ReadableStream<T>,
): AsyncIterableStream<T> {
  // 通过 TransformStream 进行管道传输以确保提供新鲜的、未锁定的流。
  const stream = source.pipeThrough(new TransformStream<T, T>());

  /**
   * 实现流的异步迭代器协议。
   * 确保在完成、提前退出或出错时进行正确的清理（取消并释放读取器）。
   */
  (stream as AsyncIterableStream<T>)[Symbol.asyncIterator] = function (
    this: ReadableStream<T>,
  ): AsyncIterator<T> {
    const reader = this.getReader();

    let finished = false;

    /**
     * 通过取消和释放锁定来清理读取器。
     */
    async function cleanup(cancelStream: boolean) {
      if (finished) return;

      finished = true;
      try {
        if (cancelStream) {
          await reader.cancel?.();
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {}
      }
    }

    return {
      /**
       * 从流中读取下一个块。
       * @returns A promise resolving to the next IteratorResult.
       */
      async next(): Promise<IteratorResult<T>> {
        if (finished) {
          return { done: true, value: undefined };
        }

        const { done, value } = await reader.read();

        if (done) {
          await cleanup(true);
          return { done: true, value: undefined };
        }

        return { done: false, value };
      },

      /**
       * 可以在提前退出时（例如，从 for-await 中中断）或完成后调用。
       * 确保取消流并释放资源。
       * @returns A promise resolving to a completed IteratorResult.
       */
      async return(): Promise<IteratorResult<T>> {
        await cleanup(true);
        return { done: true, value: undefined };
      },

      /**
       * 调用提前退出时出现错误。
       * 确保取消流并释放资源，然后重新引发错误。
       * @param err The error to throw.
       * @returns A promise that rejects with the provided error.
       */
      async throw(err: unknown): Promise<IteratorResult<T>> {
        await cleanup(true);
        throw err;
      },
    };
  };

  return stream as AsyncIterableStream<T>;
}
