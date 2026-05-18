import { prepareHeaders } from '../util/prepare-headers';
import { JsonToSseTransformStream } from './json-to-sse-transform-stream';
import { UI_MESSAGE_STREAM_HEADERS } from './ui-message-stream-headers';
import type { UIMessageChunk } from './ui-message-chunks';
import type { UIMessageStreamResponseInit } from './ui-message-stream-response-init';

/**
 * 从 UI 消息流创建 Response 对象。
 * 该流将转换为服务器发送事件 (SSE) 格式。
 *
 * @param options.status - The HTTP status code for the response.
 * @param options.statusText - The HTTP status text for the response.
 * @param options.headers - Additional HTTP headers to include in the response.
 * @param options.stream - The UI message chunk stream to send.
 * @param options.consumeSseStream - Optional callback to consume a copy of the SSE stream independently.
 *
 * @returns A `Response` object with the UI message stream as the body.
 */
export function createUIMessageStreamResponse({
  status,
  statusText,
  headers,
  stream,
  consumeSseStream,
}: UIMessageStreamResponseInit & {
  stream: ReadableStream<UIMessageChunk>;
}): Response {
  let sseStream = stream.pipeThrough(new JsonToSseTransformStream());

  // 当提供consumeSseStream时，我们需要对流进行tee处理
  // 并将第二部分发送到consumSseStream函数
  // 以便客户可以独立消费
  if (consumeSseStream) {
    const [stream1, stream2] = sseStream.tee();
    sseStream = stream1;
    consumeSseStream({ stream: stream2 }); // no await (do not block the response)
  }

  return new Response(sseStream.pipeThrough(new TextEncoderStream()), {
    status,
    statusText,
    headers: prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS),
  });
}
