import type { ServerResponse } from 'node:http';
import { prepareHeaders } from '../util/prepare-headers';
import { writeToServerResponse } from '../util/write-to-server-response';

/**
 * 将文本流写入 Node.js ServerResponse 对象。
 * 每个文本块都被编码为 UTF-8 并作为单独的块写入。
 * 将`Content-Type`标头设置为`text/plain`；字符集=utf-8`。
 *
 * @param options - 用于管道流的选项。
 * @param options.response - 要写入的 Node.js ServerResponse。
 * @param options.status - 可选的 HTTP 状态代码。
 * @param options.statusText - 可选的 HTTP 状态文本。
 * @param options.headers - 可选的响应标头。
 * @param options.textStream - 要通过管道传输的文本流。
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
