import type { UIMessage } from '../ui';
import type { ErrorHandler } from '../util/error-handler';
import type { InferUIMessageChunk } from './ui-message-chunks';

export interface UIMessageStreamWriter<
  UI_MESSAGE extends UIMessage = UIMessage,
> {
  /**
   * 将数据流部分附加到流中。
   */
  write(part: InferUIMessageChunk<UI_MESSAGE>): void;

  /**
   * 将另一个流的内容合并到此流。
   */
  merge(stream: ReadableStream<InferUIMessageChunk<UI_MESSAGE>>): void;

  /**
   * 数据流编写器使用的错误处理程序。
   * 这是为了合并流时转发
   * 以防止重复错误屏蔽。
   */
  onError: ErrorHandler | undefined;
}
