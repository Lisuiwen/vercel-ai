import { prepareHeaders } from '../util/prepare-headers';

/**
 * 从文本流创建 Response 对象。
 * 每个文本块都编码为 UTF-8 并作为单独的块发送。
 * 将`Content-Type`标头设置为`text/plain`；字符集=utf-8`。
 *
 * @param options - 用于创建响应的选项。
 * @param options.status - 可选的 HTTP 状态代码（默认值：200）。
 * @param options.statusText - 可选的 HTTP 状态文本。
 * @param options.headers - 可选的响应标头。
 * @param options.textStream - 要发送的文本流。
 * @returns 带有文本流主体的 Response 对象。
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
