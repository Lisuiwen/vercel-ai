import { prepareHeaders } from '../util/prepare-headers';

/**
 * 从文本流创建 Response 对象。
 * 每个文本块都编码为 UTF-8 并作为单独的块发送。
 * 将“Content-Type”标头设置为“text/plain”；字符集=utf-8`。
 *
 * @param options - The options for creating the response.
 * @param options.status - Optional HTTP status code (default: 200).
 * @param options.statusText - Optional HTTP status text.
 * @param options.headers - Optional response headers.
 * @param options.textStream - The text stream to send.
 * @returns A Response object with the text stream body.
 */
export function createTextStreamResponse({
  status,
  statusText,
  headers,
  textStream,
}: ResponseInit & {
  textStream: ReadableStream<string>;
}): Response {
  return new Response(textStream.pipeThrough(new TextEncoderStream()), {
    status: status ?? 200,
    statusText,
    headers: prepareHeaders(headers, {
      'content-type': 'text/plain; charset=utf-8',
    }),
  });
}
