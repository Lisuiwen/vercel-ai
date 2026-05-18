/**
 * 结合了 AsyncIterable 和 ReadableStream 的类型。
 * 这允许使用 for-await-of 语法来使用 ReadableStream。
 */
export type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

/**
 * 包装 ReadableStream 并返回一个既是 ReadableStream 又是 AsyncIterable 的对象。
 * 这使得可以利用for-await-of来消耗流量，并在提前退出或错误时进行适当的资源清理。
 *
 * @template T 流块的类型。
 * @param source 要包装的源 ReadableStream。
 * @returns 可以用作 ReadableStream 和 AsyncIterable 的 AsyncIterableStream。
 */
export function createAsyncIterableStream<T>(
  source: ReadableStream<T>,
): AsyncIterableStream<T> {
  // 通过TransformStream进行管道传输以确保提供新鲜的、未锁定的流。
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
       * @returns 解决下一个 IteratorResult 的承诺。
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
       * @returns 解析为完成的 IteratorResult 的承诺。
       */
      async return(): Promise<IteratorResult<T>> {
        await cleanup(true);
        return { done: true, value: undefined };
      },

      /**
       * 调用提前退出时出现错误。
       * 确保取消流并释放资源，然后重新引发错误。
       * @param err 要抛出的错误。
       * @returns 因提供的错误而拒绝的承诺。
       */
      async throw(err: unknown): Promise<IteratorResult<T>> {
        await cleanup(true);
        throw err;
      },
    };
  };

  return stream as AsyncIterableStream<T>;
}
