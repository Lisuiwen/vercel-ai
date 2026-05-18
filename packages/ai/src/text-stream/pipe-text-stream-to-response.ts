import type { ServerResponse } from 'node:http';
import { prepareHeaders } from '../util/prepare-headers';
import { writeToServerResponse } from '../util/write-to-server-response';

/**
 * 将文本流写入 Node.js ServerResponse 对象。
 * 每个文本块都被编码为 UTF-8 并作为单独的块写入。
 * 将“Content-Type”标头设置为“text/plain”；字符集=utf-8`。
 *
 * @param options - The options for piping the stream.
 * @param options.response - The Node.js ServerResponse to write to.
 * @param options.status - Optional HTTP status code.
 * @param options.statusText - Optional HTTP status text.
 * @param options.headers - Optional response headers.
 * @param options.textStream - The text stream to pipe.
 */
export function pipeTextStreamToResponse({
  response,
  status,
  statusText,
  headers,
  textStream,
}: {
  response: ServerResponse;
  textStream: ReadableStream<string>;
} & ResponseInit): void {
  writeToServerResponse({
    response,
    status,
    statusText,
    headers: Object.fromEntries(
      prepareHeaders(headers, {
        'content-type': 'text/plain; charset=utf-8',
      }).entries(),
    ),
    stream: textStream.pipeThrough(new TextEncoderStream()),
  });
}
