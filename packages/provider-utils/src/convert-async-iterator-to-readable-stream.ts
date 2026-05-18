/**
 * 将 AsyncIterator 转换为 ReadableStream。
 *
 * @template T - The type of elements produced by the AsyncIterator.
 * @param { <T>} iterator - The AsyncIterator to convert.
 * @returns {ReadableStream<T>} - A ReadableStream that provides the same data as the AsyncIterator.
 */
export function convertAsyncIteratorToReadableStream<T>(
  iterator: AsyncIterator<T>,
): ReadableStream<T> {
  let cancelled = false;

  return new ReadableStream<T>({
    /**
     * 当消费者想要从流中提取更多数据时调用。
     *
     * @param {ReadableStreamDefaultController<T>} controller - The controller to enqueue data into the stream.
     * @returns {Promise<void>}
     */
    async pull(controller) {
      if (cancelled) return;
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    /**
     * 当消费者取消流时调用。
     */
    async cancel(reason?: unknown) {
      cancelled = true;
      if (iterator.return) {
        try {
          await iterator.return(reason);
        } catch {
          // 故意忽略取消期间的错误
        }
      }
    },
  });
}
