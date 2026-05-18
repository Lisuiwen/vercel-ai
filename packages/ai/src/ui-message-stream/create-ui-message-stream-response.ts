import { prepareHeaders } from '../util/prepare-headers';
import { JsonToSseTransformStream } from './json-to-sse-transform-stream';
import { UI_MESSAGE_STREAM_HEADERS } from './ui-message-stream-headers';
import type { UIMessageChunk } from './ui-message-chunks';
import type { UIMessageStreamResponseInit } from './ui-message-stream-response-init';

/**
 * 从 UI 消息流创建 Response 对象。
 * 该流将转换为服务器发送事件（SSE）格式。
 *
 * @param options.status - 响应的 HTTP 状态代码。
 * @param options.statusText - 响应的 HTTP 状态文本。
 * @param options.headers - 要包含在响应中的其他 HTTP 标头。
 * @param options.stream - 要发送的 UI 消息块流。
 * @param options.consumeSseStream - 用于独立使用 SSE 流副本的可选回调。
 *
 * @returns 以 UI 消息流作为主体的`Response`对象。
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
  // 将第二部分发送到consumSseStream函数
  // 以便客户可以独立消费
  if (consumeSseStream) {
    const [stream1, stream2] = sseStream.tee();
    sseStream = stream1;
    consumeSseStream({ stream: stream2 }); // 不等待（不阻止响应）
  }

  return new Response(sseStream.pipeThrough(new TextEncoderStream()), {
    status,
    statusText,
    headers: prepareHeaders(headers, UI_MESSAGE_STREAM_HEADERS),
  });
}
