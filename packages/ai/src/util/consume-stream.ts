/**
 * 消耗 ReadableStream 底座完全读取。
 *
 * 该函数逐块读取流，直到流耗尽。
 * 它不处理或返回流中的数据；它只是确保
 * 读取整个流。
 *
 * @param options - 使用流的选项。
 * @param options.stream - 要使用的 ReadableStream。
 * @param options.onError - 用于处理消费期间发生的错误的可选回调。
 * @returns 当流被完全消耗时解决的承诺。
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
