import { createResolvablePromise } from './create-resolvable-promise';

/**
 * 创建一个可缝合流，一次可以通过管道传输一个流。
 *
 * @template T - The type of values emitted by the streams.
 * @returns {Object} An object containing the stitchable stream and control methods.
 */
export function createStitchableStream<T>(): {
  stream: ReadableStream<T>;
  addStream: (innerStream: ReadableStream<T>) => void;
  close: () => void;
  terminate: () => void;
} {
  let innerStreamReaders: ReadableStreamDefaultReader<T>[] = [];
  let controller: ReadableStreamDefaultController<T> | null = null;
  let isClosed = false;
  let waitForNewStream = createResolvablePromise<void>();

  const terminate = () => {
    isClosed = true;
    waitForNewStream.resolve();

    innerStreamReaders.forEach(reader => reader.cancel());
    innerStreamReaders = [];
    controller?.close();
  };

  const processPull = async () => {
    // 情况1：外部流关闭，不再有内部流
    if (isClosed && innerStreamReaders.length === 0) {
      controller?.close();
      return;
    }

    // 情况 2：没有可用的内部流，但外部流已打开
    // 等待添加新的内部流或外部流关闭
    if (innerStreamReaders.length === 0) {
      waitForNewStream = createResolvablePromise<void>();
      await waitForNewStream.promise;
      return await processPull();
    }

    try {
      const { value, done } = await innerStreamReaders[0].read();

      if (done) {
        // 情况3：当前内部流已完成
        innerStreamReaders.shift(); // 删除完成的流

        if (innerStreamReaders.length === 0 && isClosed) {
          // 当关闭且不再有内部流时，停止拉动
          controller?.close();
        } else {
          // 继续从下一个流中拉取
          await processPull();
        }
      } else {
        // 情况 4：当前内部流返回一个项目
        controller?.enqueue(value);
      }
    } catch (error) {
      // 情况 5：当前内部流抛出错误
      controller?.error(error);
      innerStreamReaders.shift(); // 删除错误的流
      terminate(); // 我们出错了，终止所有流
    }
  };

  return {
    stream: new ReadableStream<T>({
      start(controllerParam) {
        controller = controllerParam;
      },
      pull: processPull,
      async cancel() {
        for (const reader of innerStreamReaders) {
          await reader.cancel();
        }
        innerStreamReaders = [];
        isClosed = true;
      },
    }),
    addStream: (innerStream: ReadableStream<T>) => {
      if (isClosed) {
        throw new Error('Cannot add inner stream: outer stream is closed');
      }

      innerStreamReaders.push(innerStream.getReader());
      waitForNewStream.resolve();
    },

    /**
     * 优雅地关闭外部流。这将使内部流
     * 完成处理然后关闭外流。
     */
    close: () => {
      isClosed = true;
      waitForNewStream.resolve();

      if (innerStreamReaders.length === 0) {
        controller?.close();
      }
    },

    /**
     * 立即关闭外流。这将取消所有内部流
     * 并关闭外流。
     */
    terminate,
  };
}
