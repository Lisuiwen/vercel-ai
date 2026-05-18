/**
 * 消耗 ReadableStream 直至完全读取。
 *
 * 该函数逐块读取流，直到流耗尽。
 * 它不处理或返回流中的数据；它只是确保
 * 读取整个流。
 *
 * @param options - The options for consuming the stream.
 * @param options.stream - The ReadableStream to be consumed.
 * @param options.onError - Optional callback to handle errors that occur during consumption.
 * @returns A promise that resolves when the stream is fully consumed.
 */
export async function consumeStream({
  stream,
  onError,
}: {
  stream: ReadableStream;
  onError?: (error: unknown) => void;
}): Promise<void> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch (error) {
    onError?.(error);
  } finally {
    reader.releaseLock();
  }
}
